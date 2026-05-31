// src/components/executive/ExecutiveSummary.tsx
import { useOmnisentinelStore } from '../../hooks/useOmnisentinelStore';
import { TrendingDown, ShieldCheck, AlertOctagon, DollarSign } from 'lucide-react';

export function ExecutiveSummary() {
  const { calculatedNodes } = useOmnisentinelStore();
  const nodesArray = Object.values(calculatedNodes);

  const totalDailyLoss = nodesArray.reduce((sum, n) => sum + n.exposedLoss, 0);
  const criticalNodes = nodesArray.filter(n => n.systemicRisk > 60 && !n.isKilled);
  const mitigatedLoss = nodesArray.filter(n => n.isKilled).reduce((sum, n) => sum + n.financialImpact.dailyLoss, 0);
  const potentialSavings = totalDailyLoss * 0.7;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* KPI Cards Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-warroom-panel border border-red-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingDown className="w-24 h-24 text-red-500" /></div>
          <div className="text-sm text-gray-400 uppercase tracking-wider mb-2 font-semibold">Pérdida Diaria Expuesta</div>
          <div className="text-4xl font-mono font-bold text-warroom-danger">
            ${totalDailyLoss.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-2">USD/día en riesgo operativo</div>
        </div>

        <div className="p-6 rounded-xl bg-warroom-panel border border-green-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck className="w-24 h-24 text-green-500" /></div>
          <div className="text-sm text-gray-400 uppercase tracking-wider mb-2 font-semibold">Capital Protegido</div>
          <div className="text-4xl font-mono font-bold text-warroom-accent">
            ${mitigatedLoss.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-2">USD/día salvados por Kill Switch</div>
        </div>

        <div className="p-6 rounded-xl bg-warroom-panel border border-blue-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><AlertOctagon className="w-24 h-24 text-blue-500" /></div>
          <div className="text-sm text-gray-400 uppercase tracking-wider mb-2 font-semibold">Nodos Críticos Activos</div>
          <div className="text-4xl font-mono font-bold text-white">
            {criticalNodes.length}
          </div>
          <div className="text-xs text-gray-500 mt-2">Requieren atención inmediata del COO</div>
        </div>
      </div>

      {/* Tabla Ejecutiva: Top Fugas */}
      <div className="p-6 rounded-xl bg-warroom-panel border border-warroom-border">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-warroom-accent" /> Top 5 Fugas Financieras Prioritarias
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-gray-500 border-b border-gray-800">
              <tr>
                <th className="pb-3 font-medium">Área / Nodo</th>
                <th className="pb-3 font-medium">Responsable</th>
                <th className="pb-3 font-medium">Tipo de Fuga</th>
                <th className="pb-3 font-medium text-right">Pérdida/Día</th>
                <th className="pb-3 font-medium text-right">Riesgo Sistémico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {[...nodesArray]
                .sort((a, b) => b.exposedLoss - a.exposedLoss)
                .slice(0, 5)
                .map((node) => (
                  <tr key={node.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 font-medium text-white">{node.name}</td>
                    <td className="py-4 text-gray-400">{node.owner}</td>
                    <td className="py-4">
                      <span className="inline-block px-2 py-1 rounded text-xs bg-gray-800 text-gray-300 border border-gray-700">
                        {node.leakType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-right font-mono font-bold text-warroom-danger">
                      ${node.exposedLoss.toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      <span className={`font-mono font-bold ${node.systemicRisk > 60 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {node.systemicRisk.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Banner de ROI Mejorado */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-green-500/20 p-3 rounded-lg">
            <TrendingDown className="w-6 h-6 text-green-400 rotate-180" />
          </div>
          <div>
            <div className="text-green-400 font-bold text-lg">Oportunidad de Recuperación Estimada</div>
            <div className="text-gray-300 mt-1">
              Si se ejecutan los planes de acción en los nodos críticos, el ROI proyectado es de{' '}
              <span className="text-white font-bold text-xl">${Math.round(potentialSavings * 30).toLocaleString()} USD/mes</span>
            </div>
          </div>
        </div>
        <button className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-colors whitespace-nowrap">
          Ver Plan de Acción
        </button>
      </div>
    </div>
  );
}