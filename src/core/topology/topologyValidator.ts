// src/core/topology/topologyValidator.ts
import type { ProjectNode } from '../../types/omnisentinel';

export interface TopologyError {
  type: 'CYCLE' | 'ORPHAN' | 'MISSING_PARENT' | 'BOTTLENECK' | 'NO_OWNER';
  severity: 'CRITICAL' | 'WARNING';
  nodeId: string;
  nodeName: string;
  message: string;
}

export function validateTopology(nodes: ProjectNode[]): TopologyError[] {
  const errors: TopologyError[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // Detectar ciclos con DFS
  const hasCycle = (id: string): boolean => {
    if (recursionStack.has(id)) return true;
    if (visited.has(id)) return false;
    
    visited.add(id);
    recursionStack.add(id);
    
    const node = nodeMap.get(id);
    if (node) {
      for (const parentId of node.parents) {
        if (hasCycle(parentId)) return true;
      }
    }
    
    recursionStack.delete(id);
    return false;
  };

  for (const node of nodes) {
    // 1. Validar Owner (cultural)
    if (!node.owner || node.owner.trim() === '') {
      errors.push({
        type: 'NO_OWNER',
        severity: 'WARNING',
        nodeId: node.id,
        nodeName: node.name,
        message: `Fuga sin responsable: "${node.name}" no tiene owner asignado.`
      });
    }

    // 2. Padres inexistentes
    for (const parentId of node.parents) {
      if (!nodeMap.has(parentId)) {
        errors.push({
          type: 'MISSING_PARENT',
          severity: 'CRITICAL',
          nodeId: node.id,
          nodeName: node.name,
          message: `Dependencia fantasma: "${node.name}" depende de nodo inexistente "${parentId}".`
        });
      }
    }

    // 3. Cuellos de botella (>8 dependencias)
    if (node.parents.length > 8) {
      errors.push({
        type: 'BOTTLENECK',
        severity: 'WARNING',
        nodeId: node.id,
        nodeName: node.name,
        message: `Riesgo de concentración: "${node.name}" tiene ${node.parents.length} dependencias.`
      });
    }

    // 4. Ciclos
    if (hasCycle(node.id)) {
      errors.push({
        type: 'CYCLE',
        severity: 'CRITICAL',
        nodeId: node.id,
        nodeName: node.name,
        message: `Bucle infinito detectado en "${node.name}".`
      });
    }
  }

  return errors;
}