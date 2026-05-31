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

  // Algoritmo DFS para detectar ciclos
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
    // 1. Validación Cultural: ¿Tiene dueño?
    if (!node.owner || node.owner.trim() === '') {
      errors.push({
        type: 'NO_OWNER',
        severity: 'WARNING',
        nodeId: node.id,
        nodeName: node.name,
        message: `Fuga sin responsable: "${node.name}" no tiene owner asignado.`
      });
    }

    // 2. Padres inexistentes (Rompe el cálculo V-CORE)
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

    // 3. Cuellos de botella sistémicos (>8 dependencias)
    if (node.parents.length > 8) {
       errors.push({
         type: 'BOTTLENECK',
         severity: 'WARNING',
         nodeId: node.id,
         nodeName: node.name,
         message: `Riesgo de concentración: "${node.name}" depende de ${node.parents.length} factores.`
       });
    }

    // 4. Bucles infinitos (A depende de B, y B depende de A)
    // Reiniciamos visited para cada nodo raíz potencial si quisiéramos ser exhaustivos, 
    // pero para detección rápida de ciclos en grafos dirigidos, este enfoque es suficiente para MVP.
    if (hasCycle(node.id)) {
       errors.push({
         type: 'CYCLE',
         severity: 'CRITICAL',
         nodeId: node.id,
         nodeName: node.name,
         message: `Bucle infinito detectado en "${node.name}". El V-CORE no puede calcular contagio circular.`
       });
    }
  }

  return errors;
}