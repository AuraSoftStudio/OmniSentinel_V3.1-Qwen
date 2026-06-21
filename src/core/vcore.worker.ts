// src/core/vcore.worker.ts
import { expose } from 'comlink';
import type { ProjectNode } from '../services/dataParser';

export interface ProcessedNode extends ProjectNode {
  exposedLoss: number;
}

export interface ProcessGraphResult {
  success: boolean;
  nodes: ProcessedNode[];
  cycles: string[];
  errors: string[];
}

function detectCycles(nodes: ProjectNode[]): string[] {
  const cycles: string[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const hasCycle = (id: string, path: string[] = []): boolean => {
    if (recursionStack.has(id)) {
      const cycleStart = path.indexOf(id);
      if (cycleStart !== -1) {
        cycles.push(path.slice(cycleStart).join(' → ') + ' → ' + id);
      }
      return true;
    }
    if (visited.has(id)) return false;
    
    visited.add(id);
    recursionStack.add(id);
    path.push(id);
    
    const node = nodeMap.get(id);
    if (node) {
      for (const parentId of node.parents) {
        if (hasCycle(parentId, [...path])) return true;
      }
    }
    
    recursionStack.delete(id);
    return false;
  };

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      hasCycle(node.id);
    }
  }

  return cycles;
}

function calculateSystemicRisk(
  nodeId: string,
  nodeMap: Map<string, ProjectNode>,
  calculatedRisks: Map<string, number>,
  visitedInPath: Set<string> = new Set()
): number {
  if (visitedInPath.has(nodeId)) return 0;
  if (calculatedRisks.has(nodeId)) return calculatedRisks.get(nodeId)!;
  
  visitedInPath.add(nodeId);
  
  const node = nodeMap.get(nodeId);
  if (!node) return 0;
  
  if (node.isKilled) {
    calculatedRisks.set(nodeId, 0);
    return 0;
  }
  
  let systemicRisk = node.riskBase;
  
  for (const parentId of node.parents) {
    const parentRisk = calculateSystemicRisk(
      parentId,
      nodeMap,
      calculatedRisks,
      new Set(visitedInPath)
    );
    systemicRisk += parentRisk * 0.3;
  }
  
  systemicRisk += node.saturacionFlota * 20;
  systemicRisk += node.bloqueosCriticos * 15;
  systemicRisk += node.riesgoExterno * 10;
  
  const clampedRisk = Math.max(0, Math.min(100, systemicRisk));
  calculatedRisks.set(nodeId, clampedRisk);
  return clampedRisk;
}

// 🔥 EXPORTADO CORRECTAMENTE: La función se llama processGraph
export function processGraph(nodes: ProjectNode[]): ProcessGraphResult {
  const errors: string[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  const cycles = detectCycles(nodes);
  if (cycles.length > 0) {
    errors.push(`Se detectaron ${cycles.length} ciclo(s) en las dependencias`);
  }
  
  for (const node of nodes) {
    for (const parentId of node.parents) {
      if (!nodeMap.has(parentId)) {
        errors.push(`Nodo "${node.name}" depende de "${parentId}" que no existe`);
      }
    }
  }
  
  const calculatedRisks = new Map<string, number>();
  const processedNodes: ProcessedNode[] = [];
  
  for (const node of nodes) {
    const systemicRisk = calculateSystemicRisk(node.id, nodeMap, calculatedRisks);
    const exposedLoss = node.daily_operation_cost * (systemicRisk / 100);
    
    processedNodes.push({
      ...node,
      riskBase: systemicRisk,
      exposedLoss,
      metadata: {
        ...node.metadata,
        originalRiskBase: node.riskBase,
        systemicRisk,
        contagionDelta: systemicRisk - node.riskBase,
        exposedLoss,
      }
    });
  }
  
  return {
    success: errors.length === 0,
    nodes: processedNodes,
    cycles,
    errors
  };
}

// 🔥 FIX: Exponer con el mismo nombre 'processGraph' para que TypeScript no se queje
expose({ processGraph });