// src/components/ui/NodeCard.tsx
import { User, AlertTriangle, TrendingDown, Power } from 'lucide-react';
import { useOmnisentinelStore } from '../../hooks/useOmnisentinelStore';

interface NodeCardProps {
  id: string;
  onClick?: () => void;
}

export const NodeCard: React.FC<NodeCardProps> = ({ id, onClick }) => {
  const { processedNodes, toggleKillSwitch } = useOmnisentinelStore();
  
  const node = processedNodes.find((n: any) => n.id === id) as any;
  
  if (!node) return null;

  const riskLevel = node.riskBase;
  
  const getRiskColor = () => {
    if (riskLevel > 60) return 'red';
    if (riskLevel > 40) return 'yellow';
    return 'green';
  };

  const riskColor = getRiskColor();

  return (
    <div 
      onClick={onClick}
      className={`relative p-6 rounded-xl border transition-all cursor-pointer group ${
        node.isKilled 
          ? 'bg-gray-900/50 border-gray-700 opacity-60' 
          : riskColor === 'red'
            ? 'bg-gradient-to-br from-red-950/30 to-black border-red-900/50 hover:border-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]'
            : riskColor === 'yellow'
              ? 'bg-gradient-to-br from-yellow-950/20 to-black border-yellow-900/30 hover:border-yellow-500'
              : 'bg-gradient-to-br from-green-950/20 to-black border-green-900/30 hover:border-green-500'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-red-400 transition-colors">
            {node.name}
          </h3>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <User className="w-3 h-3" />
            <span>{node.owner}</span>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
          riskColor === 'red' 
            ? 'bg-red-900/30 text-red-400 border-red-500/50' 
            : riskColor === 'yellow'
              ? 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50'
              : 'bg-green-900/30 text-green-400 border-green-500/50'
        }`}>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {riskLevel.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 🔥 CAMBIO: Mostrar PÉRDIDA EXPUESTA en lugar de costo base */}
      <div className="mb-4 p-3 bg-black/40 rounded-lg border-l-2 border-red-500">
        <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase tracking-wider mb-1">
          <TrendingDown className="w-3 h-3" />
          PÉRDIDA DIARIA EXPUESTA
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-red-500 font-mono">
            ${Math.round(node.exposedLoss).toLocaleString()}
          </span>
          <span className="text-xs text-gray-500">USD/día</span>
        </div>
        <div className="mt-2 text-xs text-orange-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
          {node.leakType.replace(/_/g, ' ')}
        </div>
        {/* Tooltip informativo */}
        <div className="mt-1 text-[10px] text-gray-600">
          Costo base: ${node.daily_operation_cost.toLocaleString()} × {riskLevel.toFixed(1)}% riesgo
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleKillSwitch(id);
        }}
        className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
          node.isKilled
            ? 'bg-green-600 hover:bg-green-500 text-white'
            : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30'
        }`}
      >
        <Power className="w-4 h-4" />
        {node.isKilled ? 'REACTIVAR NODO' : 'ACTIVAR KILL SWITCH'}
      </button>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-[10px] text-gray-500 bg-black/60 px-2 py-1 rounded">
          Ver detalle →
        </div>
      </div>
    </div>
  );
};