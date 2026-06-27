import type { ProjectNode } from '../types/omnisentinel';

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
      const idx = path.indexOf(id);
      if (idx !== -1) cycles.push(path.slice(idx).join(' → ') + ' → ' + id);
      return true;
    }
    if (visited.has(id)) return false;
    visited.add(id);
    recursionStack.add(id);
    path.push(id);
    const node = nodeMap.get(id);
    if (node) {
      for (const parentId of node.parents || []) {
        if (hasCycle(parentId, [...path])) return true;
      }
    }
    recursionStack.delete(id);
    return false;
  };

  for (const node of nodes) {
    if (!visited.has(node.id)) hasCycle(node.id);
  }
  return cycles;
}

function calculateRisk(id: string, map: Map<string, ProjectNode>, cache: Map<string, number>, visited: Set<string>): number {
  if (visited.has(id) || cache.has(id)) return cache.get(id) || 0;
  visited.add(id);
  const node = map.get(id);
  if (!node) return 0;
  if (node.isKilled) { cache.set(id, 0); return 0; }

  let risk = Number(node.riskBase) || 0;
  for (const pid of node.parents || []) {
    risk += calculateRisk(pid, map, cache, new Set(visited)) * 0.3;
  }
  risk += (Number(node.saturacionFlota) || 0) * 20;
  risk += (Number(node.bloqueosCriticos) || 0) * 15;
  risk += (Number(node.riesgoExterno) || 0) * 10;

  const final = Math.max(0, Math.min(100, risk));
  cache.set(id, final);
  return final;
}

export function processGraph(nodes: ProjectNode[]): ProcessGraphResult {
  const errors: string[] = [];
  const map = new Map(nodes.map(n => [n.id, n]));
  const cycles = detectCycles(nodes);
  if (cycles.length) errors.push(`Ciclos detectados: ${cycles.length}`);

  const cache = new Map<string, number>();
  const processed: ProcessedNode[] = nodes.map(node => {
    const risk = calculateRisk(node.id, map, cache, new Set());
    const cost = Number(node.daily_operation_cost) || 0;
    return {
      ...node,
      riskBase: risk,
      exposedLoss: cost * (risk / 100),
      parents: node.parents || [],
      metadata: { ...node.metadata, originalRiskBase: node.riskBase, systemicRisk: risk }
    };
  });

  return { success: errors.length === 0, nodes: processed, cycles, errors };
}