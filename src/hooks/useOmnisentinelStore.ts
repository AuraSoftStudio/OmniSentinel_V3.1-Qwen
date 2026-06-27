import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { idbStorage, exportProject, importProject } from '../services/storage';
import { getApplicableActions } from '../config/actionPlans';
import type { ProjectNode, SimulationRange } from '../types/omnisentinel';
import { wrap } from 'comlink';
import type { MonteCarloResult } from '../core/montecarlo.worker';
import { LOGISTICA_TEMPLATE } from '../data/logistica-template';
import { processGraph } from '../core/processGraph';

const McWorker = new Worker(new URL('../core/montecarlo.worker.ts', import.meta.url), { type: 'module' });
const mcWorker = wrap<typeof import('../core/montecarlo.worker')>(McWorker);

const CURRENCIES = { USD: { symbol: '$', rate: 1 }, CLP: { symbol: '$', rate: 850 } };

const DEFAULT_SIM_VARS = {
  inflation: { min: 0, max: 0, distribution: 'UNIFORM' as const },
  capacity: { min: 100, max: 100, distribution: 'UNIFORM' as const },
  responseTime: { min: 0, max: 0, distribution: 'UNIFORM' as const },
  failureRate: { min: 0, max: 0, distribution: 'UNIFORM' as const },
  penalty: { min: 1, max: 1, distribution: 'UNIFORM' as const },
};

type SimulationVars = typeof DEFAULT_SIM_VARS;

interface State {
  rawNodes: ProjectNode[];
  processedNodes: any[];
  graphErrors: string[];
  graphCycles: string[];
  viewMode: 'WAR_ROOM' | 'EXECUTIVE';
  selectedNodeId: string | null;
  isLoading: boolean;
  isCalculating: boolean;
  simulationVars: SimulationVars;
  isSimulationActive: boolean;
  mcResults: MonteCarloResult | null;
  isMcRunning: boolean;
  currency: 'USD' | 'CLP';
  
  init: () => Promise<void>;
  loadCustomNodes: (n: ProjectNode[]) => void;
  recalculate: () => Promise<void>;
  toggleKillSwitch: (id: string) => void;
  setViewMode: (m: 'WAR_ROOM' | 'EXECUTIVE') => void;
  setSelectedNode: (id: string | null) => void;
  updateSimulationVar: (k: keyof SimulationVars, v: SimulationRange) => void;
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
  rawNodes: [],
  processedNodes: [],
  graphErrors: [],
  graphCycles: [],
  viewMode: 'WAR_ROOM',
  selectedNodeId: null,
  isLoading: false,
  isCalculating: false,
  simulationVars: DEFAULT_SIM_VARS,
  isSimulationActive: false,
  mcResults: null,
  isMcRunning: false,
  currency: 'USD',

  init: async (): Promise<void> => {
    if (get().rawNodes.length > 0) {
      get().recalculate();
      return;
    }
    set({ isLoading: true });
    try {
      get().loadCustomNodes(LOGISTICA_TEMPLATE as unknown as ProjectNode[]);
    } catch {
      set({ isLoading: false });
    }
  },

  loadCustomNodes: (nodes) => {
    set({ rawNodes: nodes, isLoading: true });
    get().recalculate().finally(() => set({ isLoading: false }));
  },

  recalculate: async (): Promise<void> => {
    const { rawNodes, simulationVars } = get();
    if (!rawNodes.length) {
      set({ isCalculating: false });
      return;
    }
    set({ isCalculating: true });

    try {
      // 🔥 FIX: Función mid 100% defensiva. Nunca falla por undefined.
      const mid = (r?: SimulationRange) => r ? (r.min + r.max) / 2 : 0;
      
      // Garantizar que simulationVars tenga estructura completa
      const vars: SimulationVars = {
        inflation: simulationVars?.inflation || DEFAULT_SIM_VARS.inflation,
        capacity: simulationVars?.capacity || DEFAULT_SIM_VARS.capacity,
        responseTime: simulationVars?.responseTime || DEFAULT_SIM_VARS.responseTime,
        failureRate: simulationVars?.failureRate || DEFAULT_SIM_VARS.failureRate,
        penalty: simulationVars?.penalty || DEFAULT_SIM_VARS.penalty,
      };

      const simulated = rawNodes.map(n => {
        const s: any = { ...n };
        s.daily_operation_cost *= (1 + mid(vars.inflation) / 100);
        if (mid(vars.capacity) < 100) {
          s.saturacionFlota = Math.min(1, s.saturacionFlota + (100 - mid(vars.capacity)) / 200);
        }
        return s;
      });

      const result = processGraph(simulated);
      set({
        processedNodes: result.nodes,
        graphErrors: result.errors,
        graphCycles: result.cycles,
        isSimulationActive: Object.values(vars).some(r => r.min !== r.max),
        isCalculating: false
      });
    } catch (err) {
      console.error('Cálculo fallido, usando fallback:', err);
      const safeFallback = rawNodes.map(n => ({ ...n, exposedLoss: 0, parents: n.parents || [] }));
      set({
        processedNodes: safeFallback,
        graphErrors: ['Error en cálculo automático. Mostrando datos base.'],
        isCalculating: false
      });
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
    set({ simulationVars: DEFAULT_SIM_VARS, mcResults: null });
    get().recalculate();
  },
  
  setCurrency: (c) => set({ currency: c }),
  getFormattedLoss: (v) => {
    const c = get().currency;
    return `${CURRENCIES[c].symbol}${(v * CURRENCIES[c].rate).toLocaleString('es-CL')} ${c}`;
  },
  getNodeActions: (id) => {
    const n = get().processedNodes.find((x: any) => x.id === id);
    return n ? getApplicableActions({
      ...n, simRisk: n.riskBase, dailyLoss: n.daily_operation_cost,
      affectedChildrenCount: get().processedNodes.filter((x: any) => x.parents.includes(id)).length,
      isSingleParent: n.parents.length === 1, supplier_risk: n.riskBase,
      status: n.riskBase > 70 ? 'COLAPSO' : n.riskBase > 40 ? 'CRÍTICO' : 'MONITOREO'
    }) : [];
  },
  getSimulationImpact: () => {
    const { rawNodes, processedNodes } = get();
    const base = rawNodes.reduce((a, n) => a + (n.daily_operation_cost || 0), 0);
    const curr = processedNodes.reduce((a, n: any) => a + (n.exposedLoss || 0), 0);
    return {
      dailyLossDelta: curr - base,
      criticalNodesDelta: processedNodes.filter((n: any) => n.riskBase > 60).length - rawNodes.filter(n => n.riskBase > 60).length,
      riskIncrease: base ? ((curr - base) / base) * 100 : 0
    };
  },
  handleExportProject: () => exportProject({ rawNodes: get().rawNodes, simulationVars: get().simulationVars, currency: get().currency }),
  handleImportProject: async (f): Promise<void> => {
    set({ isLoading: true });
    try {
      const d = await importProject(f);
      set({ rawNodes: d.rawNodes, simulationVars: d.simulationVars || DEFAULT_SIM_VARS, currency: d.currency });
      await get().recalculate();
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      set({ isLoading: false });
    }
  },
  runMonteCarlo: async (iter): Promise<void> => {
    if (!get().rawNodes.length) { alert('Carga datos primero'); return; }
    set({ isMcRunning: true, mcResults: null });
    try {
      const res = await mcWorker.runMonteCarloSimulation({ nodes: get().rawNodes as any, iterations: iter, ranges: get().simulationVars });
      set({ mcResults: res, isMcRunning: false });
    } catch {
      set({ isMcRunning: false });
    }
  }
}), {
  name: 'omnisentinel-storage',
  storage: idbStorage,
  partialize: (s) => ({ rawNodes: s.rawNodes, currency: s.currency, viewMode: s.viewMode, simulationVars: s.simulationVars })
}));