import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { idbStorage, exportProject, importProject } from '../services/storage';
import { getApplicableActions } from '../config/actionPlans';
import type { ProjectNode } from '../types/omnisentinel';
import { wrap } from 'comlink';
import type { MonteCarloInput, MonteCarloResult, SimulationRange } from '../core/montecarlo.worker';
import { LOGISTICA_TEMPLATE } from '../data/logistica-template';
import { processGraph } from '../core/processGraph';

const McWorker = new Worker(new URL('../core/montecarlo.worker.ts', import.meta.url), { type: 'module' });
const mcWorker = wrap<typeof import('../core/montecarlo.worker')>(McWorker);

const CURRENCIES = { USD: { symbol: '$', rate: 1 }, CLP: { symbol: '$', rate: 850 } };

interface State {
  rawNodes: ProjectNode[];
  processedNodes: any[];
  graphErrors: string[];
  graphCycles: string[];
  viewMode: 'WAR_ROOM' | 'EXECUTIVE';
  selectedNodeId: string | null;
  isLoading: boolean;
  isCalculating: boolean;
  simulationVars: Record<string, SimulationRange>;
  isSimulationActive: boolean;
  mcResults: MonteCarloResult | null;
  isMcRunning: boolean;
  currency: 'USD' | 'CLP';
  init: () => void;
  loadCustomNodes: (n: ProjectNode[]) => void;
  recalculate: () => Promise<void>;
  toggleKillSwitch: (id: string) => void;
  setViewMode: (m: 'WAR_ROOM' | 'EXECUTIVE') => void;
  setSelectedNode: (id: string | null) => void;
  updateSimulationVar: (k: string, v: SimulationRange) => void;
  resetSimulation: () => void;
  setCurrency: (c: 'USD' | 'CLP') => void;
  getFormattedLoss: (v: number) => string;
  getNodeActions: (id: string) => any[];
  getSimulationImpact: () => any;
  handleExportProject: () => void;
  handleImportProject: (f: File) => Promise<void>;
  runMonteCarlo: (i: number) => Promise<void>;
}

export const useOmnisentinelStore = create<State>()(persist((set, get) => ({
  rawNodes: [], processedNodes: [], graphErrors: [], graphCycles: [],
  viewMode: 'WAR_ROOM', selectedNodeId: null, isLoading: false, isCalculating: false,
  simulationVars: {
    inflation: { min: 0, max: 0, distribution: 'UNIFORM' },
    capacity: { min: 100, max: 100, distribution: 'UNIFORM' },
    responseTime: { min: 0, max: 0, distribution: 'UNIFORM' },
    failureRate: { min: 0, max: 0, distribution: 'UNIFORM' },
    penalty: { min: 1, max: 1, distribution: 'UNIFORM' },
  },
  isSimulationActive: false, mcResults: null, isMcRunning: false, currency: 'USD',

  init: () => {
    if (get().rawNodes.length > 0) return get().recalculate();
    set({ isLoading: true });
    try {
      get().loadCustomNodes(LOGISTICA_TEMPLATE as unknown as ProjectNode[]);
    } catch { set({ isLoading: false }); }
  },

  loadCustomNodes: (nodes) => {
    set({ rawNodes: nodes, isLoading: true });
    get().recalculate().finally(() => set({ isLoading: false }));
  },

  recalculate: async () => {
    const { rawNodes, simulationVars } = get();
    if (!rawNodes.length) return set({ isCalculating: false });
    set({ isCalculating: true });

    try {
      const mid = (r: any) => (r.min + r.max) / 2;
      const simulated = rawNodes.map(n => {
        const s: any = { ...n };
        s.daily_operation_cost *= (1 + mid(simulationVars.inflation) / 100);
        if (mid(simulationVars.capacity) < 100) s.saturacionFlota = Math.min(1, s.saturacionFlota + (100 - mid(simulationVars.capacity)) / 200);
        return s;
      });

      const result = processGraph(simulated);
      set({ processedNodes: result.nodes, graphErrors: result.errors, graphCycles: result.cycles, isSimulationActive: true });
    } catch (err) {
      console.error('Cálculo fallido, usando fallback seguro:', err);
      // 🔑 NUNCA dejar processedNodes vacío. Fallback a rawNodes con exposedLoss: 0
      const safeFallback = rawNodes.map(n => ({ ...n, exposedLoss: 0, parents: n.parents || [] }));
      set({ processedNodes: safeFallback, graphErrors: ['Error en cálculo automático. Mostrando datos base.'], isCalculating: false });
    } finally {
      set({ isCalculating: false });
    }
  },

  toggleKillSwitch: (id) => {
    set({ rawNodes: get().rawNodes.map(n => n.id === id ? { ...n, isKilled: !n.isKilled } : n) });
    get().recalculate();
  },
  setViewMode: (m) => set({ viewMode: m }),
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  updateSimulationVar: (k, v) => {
    set({ simulationVars: { ...get().simulationVars, [k]: v } });
    get().recalculate();
  },
  resetSimulation: () => {
    set({ simulationVars: { inflation: { min: 0, max: 0, distribution: 'UNIFORM' }, capacity: { min: 100, max: 100, distribution: 'UNIFORM' }, responseTime: { min: 0, max: 0, distribution: 'UNIFORM' }, failureRate: { min: 0, max: 0, distribution: 'UNIFORM' }, penalty: { min: 1, max: 1, distribution: 'UNIFORM' } }, mcResults: null });
    get().recalculate();
  },
  setCurrency: (c) => set({ currency: c }),
  getFormattedLoss: (v) => {
    const c = get().currency;
    return `${CURRENCIES[c].symbol}${(v * CURRENCIES[c].rate).toLocaleString('es-CL')} ${c}`;
  },
  getNodeActions: (id) => {
    const n = get().processedNodes.find((x: any) => x.id === id);
    return n ? getApplicableActions({ ...n, simRisk: n.riskBase, dailyLoss: n.daily_operation_cost, affectedChildrenCount: get().processedNodes.filter((x: any) => x.parents.includes(id)).length, isSingleParent: n.parents.length === 1, supplier_risk: n.riskBase, status: n.riskBase > 70 ? 'COLAPSO' : n.riskBase > 40 ? 'CRÍTICO' : 'MONITOREO' }) : [];
  },
  getSimulationImpact: () => {
    const { rawNodes, processedNodes } = get();
    const base = rawNodes.reduce((a, n) => a + (n.daily_operation_cost || 0), 0);
    const curr = processedNodes.reduce((a, n: any) => a + (n.exposedLoss || 0), 0);
    return { dailyLossDelta: curr - base, criticalNodesDelta: processedNodes.filter((n: any) => n.riskBase > 60).length - rawNodes.filter(n => n.riskBase > 60).length, riskIncrease: base ? ((curr - base) / base) * 100 : 0 };
  },
  handleExportProject: () => exportProject({ rawNodes: get().rawNodes, simulationVars: get().simulationVars, currency: get().currency }),
  handleImportProject: async (f) => {
    set({ isLoading: true });
    try {
      const d = await importProject(f);
      set({ rawNodes: d.rawNodes, simulationVars: d.simulationVars, currency: d.currency });
      await get().recalculate();
    } catch (e: any) { alert('Error: ' + e.message); } finally { set({ isLoading: false }); }
  },
  runMonteCarlo: async (iter) => {
    if (!get().rawNodes.length) return alert('Carga datos primero');
    set({ isMcRunning: true, mcResults: null });
    try {
      const res = await mcWorker.runMonteCarloSimulation({ nodes: get().rawNodes as any, iterations: iter, ranges: get().simulationVars });
      set({ mcResults: res, isMcRunning: false });
    } catch { set({ isMcRunning: false }); }
  }
}), { name: 'omnisentinel-storage', storage: idbStorage, partialize: (s) => ({ rawNodes: s.rawNodes, currency: s.currency, viewMode: s.viewMode, simulationVars: s.simulationVars }) }));