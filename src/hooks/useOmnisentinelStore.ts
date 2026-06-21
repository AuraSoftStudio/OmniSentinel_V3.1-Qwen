// src/hooks/useOmnisentinelStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { vcoreWorker } from '../services/vcoreService';
import { idbStorage, exportProject, importProject } from '../services/storage';
import { getApplicableActions } from '../config/actionPlans';
import type { ProjectNode } from '../types/omnisentinel'; // Asegúrate de importar desde types
import { wrap } from 'comlink';
import type { MonteCarloInput, MonteCarloResult, SimulationRange } from '../core/montecarlo.worker';

// 🔥 IMPORTAR TEMPLATE HARDCODEADO
import { LOGISTICA_TEMPLATE } from '../data/logistica-template';

// Inicializar Worker de Monte Carlo
const McWorker = new Worker(new URL('../core/montecarlo.worker.ts', import.meta.url), { type: 'module' });
const mcWorker = wrap<typeof import('../core/montecarlo.worker')>(McWorker);

interface CurrencyConfig {
  code: 'USD' | 'CLP';
  symbol: string;
  exchangeRate: number;
}

const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', exchangeRate: 1 },
  CLP: { code: 'CLP', symbol: '$', exchangeRate: 850 }
};

interface SimulationVars {
  inflation: SimulationRange;
  capacity: SimulationRange;
  responseTime: SimulationRange;
  failureRate: SimulationRange;
  penalty: SimulationRange;
}

interface OmnisentinelState {
  rawNodes: ProjectNode[];
  processedNodes: any[];
  graphErrors: string[];
  graphCycles: string[];
  viewMode: 'WAR_ROOM' | 'EXECUTIVE';
  selectedNodeId: string | null;
  isLoading: boolean;
  isCalculating: boolean;
  dataSource: 'SHEETS' | 'TEMPLATE' | 'CSV_IMPORT';
  
  simulationVars: SimulationVars;
  isSimulationActive: boolean;
  
  mcResults: MonteCarloResult | null;
  isMcRunning: boolean;
  currency: 'USD' | 'CLP';

  init: () => void;
  loadCustomNodes: (nodes: ProjectNode[]) => void;
  recalculate: () => Promise<void>;
  toggleKillSwitch: (nodeId: string) => void;
  setViewMode: (mode: 'WAR_ROOM' | 'EXECUTIVE') => void;
  setSelectedNode: (nodeId: string | null) => void;
  updateSimulationVar: (key: keyof SimulationVars, value: SimulationRange) => void;
  resetSimulation: () => void;
  setCurrency: (currency: 'USD' | 'CLP') => void;
  getFormattedLoss: (amountUSD: number) => string;
  getNodeActions: (nodeId: string) => any[];
  getSimulationImpact: () => { dailyLossDelta: number; criticalNodesDelta: number; riskIncrease: number };
  handleExportProject: () => void;
  handleImportProject: (file: File) => Promise<void>;
  runMonteCarlo: (iterations: number) => Promise<void>;
}

export const useOmnisentinelStore = create<OmnisentinelState>()(
  persist(
    (set, get) => ({
      rawNodes: [],
      processedNodes: [],
      graphErrors: [],
      graphCycles: [],
      viewMode: 'WAR_ROOM',
      selectedNodeId: null,
      isLoading: false,
      isCalculating: false,
      dataSource: 'TEMPLATE',
      
      simulationVars: {
        inflation: { min: 0, max: 0, distribution: 'UNIFORM' },
        capacity: { min: 100, max: 100, distribution: 'UNIFORM' },
        responseTime: { min: 0, max: 0, distribution: 'UNIFORM' },
        failureRate: { min: 0, max: 0, distribution: 'UNIFORM' },
        penalty: { min: 1, max: 1, distribution: 'UNIFORM' },
      },
      isSimulationActive: false,
      
      mcResults: null,
      isMcRunning: false,
      currency: 'USD',

      // 🔥 FIX: Carga segura sin red (Hardcoded)
      init: async () => {
        const { rawNodes } = get();
        // Si ya hay datos en memoria (por persistencia), recalcula y termina
        if (rawNodes.length > 0) {
          console.log("✅ [STORE] Datos recuperados. Recalculando...");
          get().recalculate();
          return;
        }

        console.log("🚀 [STORE] Cargando template hardcodeado...");
        set({ isLoading: true });

        // Simulamos un pequeño delay para que se vea el splash screen
        setTimeout(() => {
          try {
            // Cargamos el template directamente desde el archivo JS
            get().loadCustomNodes(LOGISTICA_TEMPLATE as unknown as ProjectNode[]);
          } catch (e) {
            console.error("❌ [STORE] Error cargando template:", e);
            set({ isLoading: false });
          }
        }, 500);
      },

      loadCustomNodes: (nodes: ProjectNode[]) => {
        console.log("📥 [STORE] Nodos cargados:", nodes.length);
        set({ rawNodes: nodes, isLoading: true, dataSource: 'CSV_IMPORT' });
        get().recalculate().finally(() => set({ isLoading: false }));
      },

      recalculate: async () => {
        const { rawNodes, simulationVars } = get();
        if (rawNodes.length === 0) {
          console.warn("⚠️ [V-CORE] Sin nodos para calcular.");
          set({ isCalculating: false });
          return;
        }
        
        console.log("⚙️ [V-CORE] Iniciando cálculo en Web Worker...");
        set({ isCalculating: true });

        try {
          const getMid = (r: SimulationRange) => (r.min + r.max) / 2;
          
          const simulatedNodes = rawNodes.map(node => {
            const s = { ...node };
            const midInflation = getMid(simulationVars.inflation);
            if (midInflation > 0) s.daily_operation_cost *= (1 + midInflation / 100);
            
            const midCapacity = getMid(simulationVars.capacity);
            if (midCapacity < 100) s.saturacionFlota = Math.min(1, s.saturacionFlota + (100 - midCapacity) / 200);
            return s;
          });

          const result = await vcoreWorker.processGraph(simulatedNodes);

          set({
            processedNodes: result.nodes,
            graphErrors: result.errors,
            graphCycles: result.cycles,
            isCalculating: false,
            isSimulationActive: Object.values(simulationVars).some(r => r.min !== r.max || r.min !== 0 && r.min !== 100 && r.min !== 1)
          });
          console.log("✅ [V-CORE] Cálculo exitoso.");
        } catch (err) {
          // 🔥 FIX: Si el worker falla, NO nos quedamos cargando para siempre
          console.error('❌ [V-CORE] Error crítico:', err);
          set({ isCalculating: false });
        }
      },

      toggleKillSwitch: (nodeId: string) => {
        const { rawNodes } = get();
        set({ rawNodes: rawNodes.map(n => n.id === nodeId ? { ...n, isKilled: !n.isKilled } : n) });
        get().recalculate();
      },

      setViewMode: (mode) => set({ viewMode: mode }),
      setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),

      updateSimulationVar: (key, value) => {
        set({ simulationVars: { ...get().simulationVars, [key]: value } });
        get().recalculate();
      },

      resetSimulation: () => {
        set({
          simulationVars: {
            inflation: { min: 0, max: 0, distribution: 'UNIFORM' },
            capacity: { min: 100, max: 100, distribution: 'UNIFORM' },
            responseTime: { min: 0, max: 0, distribution: 'UNIFORM' },
            failureRate: { min: 0, max: 0, distribution: 'UNIFORM' },
            penalty: { min: 1, max: 1, distribution: 'UNIFORM' },
          },
          mcResults: null
        });
        get().recalculate();
      },

      setCurrency: (currency) => set({ currency }),
      
      getFormattedLoss: (amountUSD: number) => {
        const { currency } = get();
        const config = CURRENCY_CONFIGS[currency];
        return `${config.symbol}${(amountUSD * config.exchangeRate).toLocaleString('es-CL', { maximumFractionDigits: 0 })} ${config.code}`;
      },

      getNodeActions: (nodeId: string) => {
        const { processedNodes } = get();
        const node = processedNodes.find((n: any) => n.id === nodeId);
        if (!node) return [];
        return getApplicableActions({
          ...node, simRisk: node.riskBase, dailyLoss: node.daily_operation_cost,
          affectedChildrenCount: processedNodes.filter((n: any) => n.parents.includes(nodeId)).length,
          isSingleParent: node.parents.length === 1, supplier_risk: node.riskBase,
          status: node.riskBase > 70 ? 'COLAPSO' : node.riskBase > 40 ? 'CRÍTICO' : 'MONITOREO'
        });
      },

      getSimulationImpact: () => {
        const { rawNodes, processedNodes } = get();
        const baselineLoss = rawNodes.reduce((s, n) => s + n.daily_operation_cost, 0);
        const currentLoss = processedNodes.reduce((s, n: any) => s + (n.exposedLoss || 0), 0);
        const baselineCritical = rawNodes.filter(n => n.riskBase > 60).length;
        const currentCritical = processedNodes.filter((n: any) => n.riskBase > 60).length;
        return {
          dailyLossDelta: currentLoss - baselineLoss,
          criticalNodesDelta: currentCritical - baselineCritical,
          riskIncrease: baselineLoss > 0 ? ((currentLoss - baselineLoss) / baselineLoss) * 100 : 0
        };
      },

      handleExportProject: () => {
        const state = get();
        exportProject({ rawNodes: state.rawNodes, simulationVars: state.simulationVars, currency: state.currency });
      },

      handleImportProject: async (file: File) => {
        try {
          const data = await importProject(file);
          set({ rawNodes: data.rawNodes, simulationVars: data.simulationVars, currency: data.currency });
          get().recalculate();
        } catch (err) {
          alert('Error al importar: ' + (err as Error).message);
        }
      },

      runMonteCarlo: async (iterations: number) => {
        const { rawNodes, simulationVars } = get();
        if (rawNodes.length === 0) {
            alert("Carga datos primero para ejecutar Monte Carlo");
            return;
        }
        set({ isMcRunning: true, mcResults: null });

        try {
          const input: MonteCarloInput = {
            nodes: rawNodes,
            iterations,
            ranges: simulationVars
          };

          const results = await mcWorker.runMonteCarloSimulation(input);
          
          set({ mcResults: results, isMcRunning: false });
        } catch (err) {
          console.error('Error en Monte Carlo:', err);
          set({ isMcRunning: false });
        }
      }
    }),
    {
      name: 'omnisentinel-storage',
      storage: idbStorage,
      partialize: (state) => ({
        rawNodes: state.rawNodes,
        currency: state.currency,
        viewMode: state.viewMode,
        simulationVars: state.simulationVars
      }),
    }
  )
);