// src/components/ui/NodeCard.tsx
import { useOmnisentinelStore } from '../../hooks/useOmnisentinelStore';
import { User, AlertTriangle, Power, TrendingDown } from 'lucide-react';

interface NodeCardProps {
  id: string;
}

export function NodeCard({ id }: NodeCardProps) {
  const { calculatedNodes, toggleKillSwitch } = useOmnisentinelStore();
  const node = calculatedNodes[id];

  if (!node) return null;

  const isCritical = node.systemicRisk > 60;
  const leakLabel = node.leakType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className={`group relative p-6 rounded-xl border transition-all duration-300 bg-warroom-panel overflow-hidden ${
      node.isKilled 
        ? 'border-gray-800 opacity-70 grayscale-[0.5]' 
        : isCritical 
          ? 'border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.15)]' 
          : 'border-white/10 hover:border-white/20'
    }`}>
      
      {/* Header con Icono de Alerta */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-white leading-tight mb-1">{node.name}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <User className="w-3 h-3" /> {node.owner}
          </div>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
          isCritical ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/10 text-green-400 border-green-500/20'
        }`}>
          <AlertTriangle className="w-3 h-3" /> {node.systemicRisk.toFixed(1)}%
        </div>
      </div>

      {/* Sección Financiera Destacada */}
      <div className="mb-6 p-4 rounded-lg bg-black/40 border border-white/5 relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-warroom-danger/50"></div>
        <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2">
          <TrendingDown className="w-3 h-3" /> Pérdida Diaria Expuesta
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-mono font-bold ${isCritical ? 'text-red-500' : 'text-gray-200'}`}>
            ${node.exposedLoss.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500">USD/día</span>
        </div>
        <div className="mt-2 text-xs text-orange-400 flex items-center gap-1 font-medium">
          💡 {leakLabel}
        </div>
      </div>

      {/* Botón de Acción */}
      <button
        onClick={() => toggleKillSwitch(id)}
        className={`w-full py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
          node.isKilled
            ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
            : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-900/20 active:scale-[0.98]'
        }`}
      >
        <Power className="w-4 h-4" />
        {node.isKilled ? 'RESTAURAR NODO' : 'ACTIVAR KILL SWITCH'}
      </button>
    </div>
  );
}