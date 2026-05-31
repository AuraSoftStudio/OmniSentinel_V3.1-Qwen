// src/hooks/useOmnisentinelStore.ts
import { create } from 'zustand';
import { calculateVCore } from '../core/vcore/engine';
import { loadFromSheets } from '../services/sheetsLoader';
import { validateTopology } from '../core/topology/topologyValidator';
import logisticsTemplate from '../data/templates/logistica.json';

import type { ProjectNode } from '../types/omnisentinel';
import type { CalculatedNode } from '../core/vcore/engine';
import type { TopologyError } from '../core/topology/topologyValidator';

interface OmnisentinelState {
  rawNodes: ProjectNode[];
  calculatedNodes: Record<string, CalculatedNode>;
  topologyErrors: TopologyError[];
  viewMode: 'WAR_ROOM' | 'EXECUTIVE';
  isLoading: boolean;
  dataSource: 'SHEETS' | 'TEMPLATE';
  
  loadFromSheets: () => Promise<void>;
  loadTemplate: () => void;
  toggleKillSwitch: (nodeId: string) => void;
  setViewMode: (mode: 'WAR_ROOM' | 'EXECUTIVE') => void;
}

export const useOmnisentinelStore = create<OmnisentinelState>((set, get) => ({
  rawNodes: [],
  calculatedNodes: {},
  topologyErrors: [],
  viewMode: 'WAR_ROOM',
  isLoading: false,
  dataSource: 'TEMPLATE', // Por defecto usamos template para demo inmediata

  loadFromSheets: async () => {
    set({ isLoading: true, dataSource: 'SHEETS' });
    try {
      const nodes = await loadFromSheets();
      
      if (nodes.length === 0) {
        console.warn("⚠️ No se cargaron nodos desde Sheets. Verifica la URL o el formato.");
        // Fallback a template si falla la carga
        get().loadTemplate();
        return;
      }

      const errors = validateTopology(nodes);
      const calculated = calculateVCore(nodes);
      
      set({ 
        rawNodes: nodes, 
        calculatedNodes: calculated,
        topologyErrors: errors,
        isLoading: false 
      });
      
      if (errors.length > 0) {
        console.warn('⚠️ Errores topológicos detectados:', errors);
        // En futuro, mostrar estos errores en UI
      }
    } catch (error) {
      console.error('❌ Fallo en carga desde Sheets, usando template fallback:', error);
      get().loadTemplate();
    }
  },

  loadTemplate: () => {
    set({ isLoading: true, dataSource: 'TEMPLATE' });
    try {
      const nodes = logisticsTemplate as unknown as ProjectNode[];
      const errors = validateTopology(nodes);
      const calculated = calculateVCore(nodes);
      
      set({ 
        rawNodes: nodes, 
        calculatedNodes: calculated,
        topologyErrors: errors,
        isLoading: false 
      });
    } catch (error) {
      console.error("❌ Error cargando template:", error);
      set({ isLoading: false });
    }
  },

  toggleKillSwitch: (nodeId: string) => {
    const { rawNodes } = get();
    const updatedNodes = rawNodes.map(n =>
      n.id === nodeId ? { ...n, isKilled: !n.isKilled } : n
    );
    const calculated = calculateVCore(updatedNodes);
    
    set({ 
      rawNodes: updatedNodes, 
      calculatedNodes: calculated 
    });
  },

  setViewMode: (mode) => set({ viewMode: mode }),
}));