// src/core/vcore/engine.ts
import type { ProjectNode } from '../../types/omnisentinel';

export interface CalculatedNode extends ProjectNode {
  systemicRisk: number;      // Riesgo total tras el contagio (0-100)
  exposedLoss: number;       // Dinero en riesgo HOY basado en el riesgo sistémico
  inheritedRisk: number;     // Cuánto riesgo le inyectaron sus padres
}

/**
 * MOTOR V-CORE 2.0
 * Calcula contagio topológico y exposición financiera.
 * Fórmula: Riesgo Final = Riesgo Local + ((100 - Riesgo Local) * (Promedio Padres / 100) * 0.45)
 */
export function calculateVCore(nodes: ProjectNode[]): Record<string, CalculatedNode> {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const results: Record<string, CalculatedNode> = {};

  // Función recursiva con memoización para evitar recálculos
  const getNodeRisk = (id: string, visited = new Set<string>()): number => {
    if (visited.has(id)) return 0; // Evitar bucles infinitos
    visited.add(id);

    const node = nodeMap.get(id);
    if (!node) return 0;

    // Si el nodo está "muerto" (Kill Switch), su riesgo es 0
    if (node.isKilled) return 0;

    // Si no tiene padres, su riesgo sistémico es solo su riesgo base
    if (node.parents.length === 0) return node.riskBase;

    // Calcular promedio de riesgo de los padres
    let parentRiskSum = 0;
    let validParents = 0;
    
    for (const parentId of node.parents) {
      parentRiskSum += getNodeRisk(parentId, new Set(visited));
      validParents++;
    }

    const avgParentRisk = validParents > 0 ? parentRiskSum / validParents : 0;
    
    // FÓRMULA DE CONTAGIO OMNISENTINEL
    const inheritedRisk = ((100 - node.riskBase) * (avgParentRisk / 100) * 0.45);
    const systemicRisk = Math.min(100, node.riskBase + inheritedRisk);

    return systemicRisk;
  };

  // Calcular para todos los nodos
  for (const node of nodes) {
    const systemicRisk = getNodeRisk(node.id);
    const inheritedRisk = systemicRisk - node.riskBase;
    
    // 💰 CÁLCULO FINANCIERO CLAVE:
    // Si el riesgo sistémico es 80% y la fuga diaria es $1000, 
    // la pérdida expuesta HOY es $800.
    const exposedLoss = (systemicRisk / 100) * node.financialImpact.dailyLoss;

    results[node.id] = {
      ...node,
      systemicRisk: Math.round(systemicRisk * 100) / 100,
      inheritedRisk: Math.round(inheritedRisk * 100) / 100,
      exposedLoss: Math.round(exposedLoss * 100) / 100,
    };
  }

  return results;
}