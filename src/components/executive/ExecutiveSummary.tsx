// src/components/executive/ExecutiveSummary.tsx
import { useOmnisentinelStore } from '../../hooks/useOmnisentinelStore';

export const ExecutiveSummary = () => {
  const { processedNodes, getFormattedLoss } = useOmnisentinelStore();
  
  // 🔥 CAMBIO: Sumar exposedLoss en lugar de daily_operation_cost
  const totalDailyLoss = processedNodes.reduce(
    (sum: number, n: any) => sum + (n.exposedLoss || 0), 
    0
  );
  
  const criticalNodes = processedNodes.filter(
    (n: any) => n.riskBase > 60 && !n.isKilled
  );
  
  // Capital protegido = suma de costos base de nodos killed
  const mitigatedLoss = processedNodes
    .filter((n: any) => n.isKilled)
    .reduce((sum: number, n: any) => sum + n.daily_operation_cost, 0);
  
  const potentialSavings = totalDailyLoss * 0.7;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-gradient-to-br from-red-950/40 to-black border border-red-900/50 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Pérdida Diaria Expuesta</p>
          <p className="text-4xl font-bold text-red-500 font-mono">
            ${Math.round(totalDailyLoss).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">USD/día (riesgo × costo)</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-950/30 to-black border border-green-900/50 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Capital Protegido</p>
          <p className="text-4xl font-bold text-green-500 font-mono">
            ${Math.round(mitigatedLoss).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">USD/día (Kill Switch activo)</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-yellow-950/30 to-black border border-yellow-900/50 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Nodos Críticos</p>
          <p className="text-4xl font-bold text-yellow-500 font-mono">
            {criticalNodes.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Requieren acción inmediata</p>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-r from-blue-950/30 via-black to-black border border-blue-900/30 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">ROI Proyectado por Mitigación</h3>
            <p className="text-xs text-gray-500 mt-1">Basado en 70% de efectividad estimada</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-400 font-mono">
              {getFormattedLoss(Math.round(potentialSavings * 30))}
            </p>
            <p className="text-xs text-gray-500">USD/mes recuperables</p>
          </div>
        </div>
      </div>

      <div className="bg-black/40 border border-white/5 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-bold text-white">Top 5 Fugas Financieras Prioritarias</h3>
        </div>
        <table className="w-full">
          <thead className="bg-black/40 text-xs text-gray-400 uppercase">
            <tr>
              <th className="text-left p-4">Nodo</th>
              <th className="text-left p-4">Responsable</th>
              <th className="text-left p-4">Tipo</th>
              <th className="text-right p-4">Pérdida Diaria</th>
              <th className="text-right p-4">Riesgo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[...processedNodes]
              .sort((a: any, b: any) => (b.exposedLoss || 0) - (a.exposedLoss || 0))
              .slice(0, 5)
              .map((node: any) => (
                <tr key={node.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4 font-medium text-white">{node.name}</td>
                  <td className="py-4 px-4 text-gray-400">{node.owner}</td>
                  <td className="py-4 px-4 text-gray-400 text-xs">
                    {node.leakType.replace(/_/g, ' ')}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-red-400 font-mono font-bold">
                      ${Math.round(node.exposedLoss || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className={`font-mono font-bold ${node.riskBase > 60 ? 'text-red-400' : 'text-yellow-400'}`}>
                      {node.riskBase.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};