// src/components/SimulatorPanel.tsx
import { useState } from 'react';
import { X, Activity, DollarSign, Zap, TrendingUp, AlertTriangle, RefreshCcw, Play, BarChart3 } from 'lucide-react';
import { useOmnisentinelStore } from '../hooks/useOmnisentinelStore';
import type { SimulationRange } from '../core/montecarlo.worker';

interface SimulatorPanelProps {
  onClose: () => void;
}

const VARIABLE_CONFIG = [
  { 
    key: 'capacity' as const, 
    label: 'Capacidad de Cumplimiento (OTIF / Fill Rate)', 
    icon: Activity, 
    color: 'text-cyan-400',
    minDefault: 85, maxDefault: 99, unit: '%',
    description: 'Porcentaje de entregas a tiempo y completas.'
  },
  { 
    key: 'responseTime' as const, 
    label: 'Lead Time (Tiempo de Entrega)', 
    icon: TrendingUp, 
    color: 'text-orange-400',
    minDefault: 3, maxDefault: 15, unit: 'días',
    description: 'Días desde la orden hasta la entrega.'
  },
  { 
    key: 'inflation' as const, 
    label: 'Inflación de Costos / Transporte', 
    icon: DollarSign, 
    color: 'text-green-400',
    minDefault: 0, maxDefault: 20, unit: '%',
    description: 'Variación en costos de combustible y fletes.'
  },
  { 
    key: 'failureRate' as const, 
    label: 'Tasa de Fallo / Devoluciones', 
    icon: AlertTriangle, 
    color: 'text-red-400',
    minDefault: 2, maxDefault: 8, unit: '%',
    description: 'Porcentaje de pedidos devueltos o fallidos.'
  },
  { 
    key: 'penalty' as const, 
    label: 'Multiplicador de Penalizaciones SLA', 
    icon: Zap, 
    color: 'text-purple-400',
    minDefault: 1, maxDefault: 10, unit: 'x',
    description: 'Multiplicador contractual ante incumplimiento.'
  }
];

export default function SimulatorPanel({ onClose }: SimulatorPanelProps) {
  const { 
    simulationVars, 
    updateSimulationVar, 
    resetSimulation, 
    isSimulationActive, 
    getSimulationImpact,
    runMonteCarlo,
    mcResults,
    isMcRunning
  } = useOmnisentinelStore();

  const [iterations, setIterations] = useState(10000);
  const impact = getSimulationImpact();

  const handleRangeChange = (key: keyof typeof simulationVars, field: keyof SimulationRange, value: any) => {
    const currentRange = simulationVars[key];
    updateSimulationVar(key, { ...currentRange, [field]: value });
  };

  const handleRunMonteCarlo = () => {
    runMonteCarlo(iterations);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[450px] bg-[#0a0a0a] border-l border-red-900/30 shadow-2xl z-50 flex flex-col">
      
      <div className="p-6 border-b border-red-900/30 flex justify-between items-center bg-gradient-to-r from-red-900/20 to-transparent">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-red-500" /> Simulador Predictivo V3.3
          </h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Motor Monte Carlo + What-If</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {isSimulationActive && (
          <div className="p-4 bg-red-950/30 border border-red-500/50 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <AlertTriangle size={16} /> ESCENARIO ACTUAL
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Delta Pérdida Diaria:</span>
                <span className="text-red-400 font-mono font-bold">
                  ${Math.abs(impact.dailyLossDelta).toLocaleString()} USD
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" /> Variables de Incertidumbre
            </h3>
            <button onClick={resetSimulation} className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1">
              <RefreshCcw size={10} /> Reset
            </button>
          </div>

          {VARIABLE_CONFIG.map((config) => {
            const currentRange = simulationVars[config.key];
            const Icon = config.icon;
            
            return (
              <div key={config.key} className="space-y-3 p-4 bg-black/40 rounded-lg border border-white/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <label className="text-xs font-medium text-gray-200">{config.label}</label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Mínimo ({config.unit})</label>
                    <input 
                      type="number"
                      value={currentRange.min}
                      onChange={(e) => handleRangeChange(config.key, 'min', Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded px-2 py-1.5 text-sm focus:border-red-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Máximo ({config.unit})</label>
                    <input 
                      type="number"
                      value={currentRange.max}
                      onChange={(e) => handleRangeChange(config.key, 'max', Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded px-2 py-1.5 text-sm focus:border-red-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Play className="w-4 h-4 text-green-500" /> Simulación Probabilística
          </h3>
          
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-400">Iteraciones:</label>
            <select value={iterations} onChange={(e) => setIterations(Number(e.target.value))} className="bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none flex-1">
              <option value={1000}>1,000</option>
              <option value={5000}>5,000</option>
              <option value={10000}>10,000</option>
            </select>
          </div>

          <button onClick={handleRunMonteCarlo} disabled={isMcRunning} className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${isMcRunning ? 'bg-gray-800 text-gray-500' : 'bg-green-600 text-white'}`}>
            {isMcRunning ? 'Calculando...' : 'Ejecutar Monte Carlo'}
          </button>
        </div>

        {mcResults && (
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Resultados</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-lg">
                <p className="text-[10px] text-gray-400">P50 (Más Probable)</p>
                <p className="text-lg font-bold text-blue-400 font-mono">${Math.round(mcResults.p50).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg">
                <p className="text-[10px] text-gray-400">P99 (Peor Escenario)</p>
                <p className="text-lg font-bold text-red-400 font-mono">${Math.round(mcResults.p99).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}