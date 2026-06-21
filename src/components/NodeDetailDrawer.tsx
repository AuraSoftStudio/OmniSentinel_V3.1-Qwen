// src/components/NodeDetailDrawer.tsx
import { X, User, AlertTriangle, TrendingUp, TrendingDown, Shield, DollarSign, Target, Activity } from 'lucide-react';
import { useOmnisentinelStore } from '../hooks/useOmnisentinelStore';
import type { ProjectNode } from '../services/dataParser';

interface NodeDetailDrawerProps {
  nodeId: string;
  onClose: () => void;
}

export default function NodeDetailDrawer({ nodeId, onClose }: NodeDetailDrawerProps) {
  const { processedNodes, toggleKillSwitch, getNodeActions } = useOmnisentinelStore();
  
  const node = processedNodes.find((n: ProjectNode) => n.id === nodeId);
  
  if (!node) return null;

  const parents = processedNodes.filter((n: ProjectNode) => 
    node.parents.includes(n.id)
  );

  const children = processedNodes.filter((n: ProjectNode) => 
    n.parents.includes(nodeId)
  );

  const actions = getNodeActions(nodeId);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-[#0a0a0a] border-l border-red-900/50 shadow-2xl overflow-y-auto">
        
        <div className="sticky top-0 z-10 p-6 border-b border-red-900/30 bg-gradient-to-r from-red-950/50 to-transparent backdrop-blur-sm">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  node.riskBase > 60 
                    ? 'bg-red-900/50 text-red-400 border border-red-500/50' 
                    : node.riskBase > 40 
                      ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/50'
                      : 'bg-green-900/50 text-green-400 border border-green-500/50'
                }`}>
                  {node.riskBase > 60 ? 'CRÍTICO' : node.riskBase > 40 ? 'MODERADO' : 'ESTABLE'}
                </span>
                {node.isKilled && (
                  <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-gray-800 text-gray-400 border border-gray-600">
                    AISLADO
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white leading-tight">{node.name}</h2>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{node.leakType.replace(/_/g, ' ')}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg bg-black/40 hover:bg-red-900/30 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <User className="w-3 h-3" /> Identidad del Nodo
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase mb-1">Responsable</p>
                <p className="text-sm text-white font-medium">{node.owner}</p>
              </div>
              <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase mb-1">Sector</p>
                <p className="text-sm text-white font-medium">{node.sector}</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-3 h-3" /> Diagnóstico Financiero
            </h3>
            <div className="p-4 bg-gradient-to-br from-red-950/30 to-black/40 rounded-lg border border-red-900/30">
              <p className="text-[10px] text-gray-400 uppercase mb-1">Costo Operativo Diario</p>
              <p className="text-3xl font-bold text-red-500 font-mono">
                ${Math.round(node.daily_operation_cost).toLocaleString()}
                <span className="text-sm text-gray-500 ml-1">USD/día</span>
              </p>
              <div className="mt-3 pt-3 border-t border-red-900/30 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Mensual</p>
                  <p className="text-sm text-white font-mono">${Math.round(node.daily_operation_cost * 30).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Anual</p>
                  <p className="text-sm text-white font-mono">${Math.round(node.daily_operation_cost * 365).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3 h-3" /> Análisis de Riesgo
            </h3>
            <div className="p-3 bg-black/40 rounded-lg border border-red-900/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-red-400 font-medium">Riesgo Sistémico</span>
                <span className={`text-sm font-mono font-bold ${
                  node.riskBase > 60 ? 'text-red-500' : node.riskBase > 40 ? 'text-yellow-500' : 'text-green-500'
                }`}>{node.riskBase.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    node.riskBase > 60 ? 'bg-red-500' : node.riskBase > 40 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${node.riskBase}%` }}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-3 h-3" /> Mapa de Dependencias
            </h3>
            
            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
              <p className="text-[10px] text-gray-400 uppercase mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-orange-400" />
                Nodos que lo AFECTAN ({parents.length})
              </p>
              {parents.length === 0 ? (
                <p className="text-xs text-gray-600 italic">Nodo raíz - sin dependencias</p>
              ) : (
                <div className="space-y-2">
                  {parents.map((parent: ProjectNode) => (
                    <div key={parent.id} className="flex items-center justify-between p-2 bg-orange-950/20 rounded border border-orange-900/30">
                      <span className="text-xs text-white">{parent.name}</span>
                      <span className={`text-xs font-mono font-bold ${
                        parent.riskBase > 60 ? 'text-red-500' : 'text-orange-400'
                      }`}>{parent.riskBase.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
              <p className="text-[10px] text-gray-400 uppercase mb-2 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-cyan-400" />
                Nodos que él AFECTA ({children.length})
              </p>
              {children.length === 0 ? (
                <p className="text-xs text-gray-600 italic">Nodo hoja - sin dependientes</p>
              ) : (
                <div className="space-y-2">
                  {children.map((child: ProjectNode) => (
                    <div key={child.id} className="flex items-center justify-between p-2 bg-cyan-950/20 rounded border border-cyan-900/30">
                      <span className="text-xs text-white">{child.name}</span>
                      <span className={`text-xs font-mono font-bold ${
                        child.riskBase > 60 ? 'text-red-500' : 'text-cyan-400'
                      }`}>{child.riskBase.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-3 h-3" /> Plan de Acción
            </h3>
            <div className="p-4 bg-gradient-to-br from-green-950/20 to-black/40 rounded-lg border border-green-900/30">
              <p className="text-sm text-gray-200 leading-relaxed mb-3">
                {node.actionPlan || 'Sin plan de acción definido'}
              </p>
            </div>

            {actions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 uppercase font-bold">Planes Tácticos Aplicables:</p>
                {actions.map((action: any) => (
                  <div key={action.id} className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm text-white font-bold">{action.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        action.cost === 'HIGH' ? 'bg-red-900/50 text-red-400' :
                        action.cost === 'MEDIUM' ? 'bg-yellow-900/50 text-yellow-400' :
                        'bg-green-900/50 text-green-400'
                      }`}>{action.cost}</span>
                    </div>
                    <p className="text-xs text-gray-400">Impacto: {action.impact}</p>
                    <p className="text-xs text-gray-400">Tiempo: {action.time}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="sticky bottom-0 p-6 border-t border-red-900/30 bg-gradient-to-r from-transparent to-red-950/30 backdrop-blur-sm">
          <button 
            onClick={() => toggleKillSwitch(nodeId)}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              node.isKilled
                ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/50'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50'
            }`}
          >
            {node.isKilled ? (
              <>
                <Shield className="w-4 h-4" /> REACTIVAR NODO
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" /> ACTIVAR KILL SWITCH
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}