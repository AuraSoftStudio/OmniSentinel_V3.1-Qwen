// src/services/dataParser.ts
import { v4 as uuidv4 } from 'uuid';

export interface ProjectNode {
  id: string;
  name: string;
  sector: 'LOGISTICA' | 'SOFTWARE' | 'FINANZAS' | string;
  riskBase: number;
  parents: string[];
  isKilled: boolean;
  owner: string;
  leakType: string;
  actionPlan: string;
  
  // Campos planos para V-CORE
  daily_operation_cost: number;
  seniority: number;
  saturacionFlota: number;
  bloqueosCriticos: number;
  riesgoExterno: number;
  
  // Metadata extensible
  metadata: Record<string, any>;
}

export interface ParseResult {
  nodes: ProjectNode[];
  errors: string[];
  warnings: string[];
  rawHeaders: string[];
  rawRows: Record<string, string>[];
}

export const INTERNAL_FIELDS = [
  { key: 'id', label: 'ID del Nodo', required: true },
  { key: 'name', label: 'Nombre del Nodo', required: true },
  { key: 'sector', label: 'Sector (LOGISTICA/SOFTWARE/FINANZAS)', required: false },
  { key: 'riskBase', label: 'Riesgo Base (%)', required: false },
  { key: 'daily_operation_cost', label: 'Costo Operativo Diario (USD)', required: true },
  { key: 'parents', label: 'Dependencias (separadas por ;)', required: false },
  { key: 'owner', label: 'Responsable', required: false },
  { key: 'leakType', label: 'Tipo de Fuga', required: false },
  { key: 'actionPlan', label: 'Plan de Acción', required: false },
  { key: 'seniority', label: 'Antigüedad (años)', required: false },
  { key: 'saturacionFlota', label: 'Saturación de Flota (0-1)', required: false },
  { key: 'bloqueosCriticos', label: 'Bloqueos Críticos (0-1)', required: false },
  { key: 'riesgoExterno', label: 'Riesgo Externo (0-1)', required: false },
];

const SMART_KEYWORDS: Record<string, string[]> = {
  id: ['id', 'node_id', 'identifier', 'key', 'codigo', 'código'],
  name: ['name', 'nombre', 'node_name', 'area', 'proceso', 'process', 'nodo'],
  sector: ['sector', 'industry', 'tipo', 'type', 'categoria', 'categoría'],
  riskBase: ['risk', 'riesgo', 'probabilidad', 'probability', 'base_risk', 'risk_base'],
  daily_operation_cost: ['daily', 'diario', 'costo', 'cost', 'perdida', 'pérdida', 'loss', 'impacto', 'impact', 'operation'],
  parents: ['parent', 'depend', 'padre', 'dependencies', 'dependencias', 'afecta'],
  owner: ['owner', 'responsable', 'manager', 'dueño', 'encargado', 'lead'],
  leakType: ['leak', 'fuga', 'tipo_fuga', 'issue', 'problema', 'problem'],
  actionPlan: ['plan', 'accion', 'acción', 'action', 'mitigacion', 'mitigación', 'solution'],
  seniority: ['seniority', 'antiguedad', 'antigüedad', 'years', 'años'],
  saturacionFlota: ['saturacion', 'saturación', 'fleet', 'flota', 'capacity'],
  bloqueosCriticos: ['bloqueos', 'blocks', 'critical', 'críticos'],
  riesgoExterno: ['externo', 'external', 'risk_ext', 'riesgo_ext'],
};

export function sanitizeNumber(value: unknown, fieldName: string): { value: number; warning: string | null } {
  if (value === null || value === undefined) {
    return { value: 0, warning: null };
  }

  if (typeof value === 'number') {
    if (isNaN(value)) return { value: 0, warning: `${fieldName}: valor NaN convertido a 0` };
    return { value, warning: null };
  }

  const str = String(value).trim();

  if (str === '' || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'na' || str === '-') {
    return { value: 0, warning: null };
  }

  const cleaned = str.replace(/[\$€£,\s]/g, '').replace(/,/g, '');
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    return { 
      value: 0, 
      warning: `${fieldName}: "${str}" no es numérico, se asume 0` 
    };
  }

  if (cleaned !== str) {
    return { 
      value: parsed, 
      warning: `${fieldName}: "${str}" limpiado a ${parsed}` 
    };
  }

  return { value: parsed, warning: null };
}

export function parseCSVContent(content: string): {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
} {
  const errors: string[] = [];
  const lines = content.trim().split('\n');
  
  if (lines.length < 2) {
    return { headers: [], rows: [], errors: ['CSV vacío o sin datos'] };
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: Record<string, string> = {};
    
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    
    rows.push(row);
  }

  return { headers, rows, errors };
}

export function autoDetectMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  headers.forEach(header => {
    const lowerHeader = header.toLowerCase();
    
    for (const [field, keywords] of Object.entries(SMART_KEYWORDS)) {
      if (keywords.some(keyword => lowerHeader.includes(keyword))) {
        if (!mapping[field]) {
          mapping[field] = header;
        }
      }
    }
  });

  return mapping;
}

export function transformToProjectNodes(
  rows: Record<string, string>[],
  mapping: Record<string, string>
): { nodes: ProjectNode[]; errors: string[]; warnings: string[] } {
  const nodes: ProjectNode[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  rows.forEach((row, index) => {
    try {
      let id = row[mapping.id];
      if (!id || id.trim() === '') {
        id = uuidv4();
        warnings.push(`Fila ${index + 2}: Sin ID, generado automáticamente (${id.substring(0, 8)}...)`);
      }

      let name = row[mapping.name];
      if (!name || name.trim() === '') {
        errors.push(`Fila ${index + 2}: Nombre vacío. Fila ignorada.`);
        return;
      }

      const sector = (row[mapping.sector] || 'LOGISTICA').toUpperCase().trim();

      const { value: riskBase, warning: riskWarning } = sanitizeNumber(
        row[mapping.riskBase] || '50',
        `Riesgo Base`
      );
      if (riskWarning) warnings.push(`Fila ${index + 2}: ${riskWarning}`);
      const clampedRisk = Math.max(0, Math.min(100, riskBase));

      const { value: daily_operation_cost, warning: lossWarning } = sanitizeNumber(
        row[mapping.daily_operation_cost] || '0',
        `Costo Operativo Diario`
      );
      if (lossWarning) warnings.push(`Fila ${index + 2}: ${lossWarning}`);

      const parentsRaw = row[mapping.parents] || '';
      const parents = parentsRaw
        .split(/[,;|]/)
        .map(p => p.trim())
        .filter(Boolean);

      const owner = row[mapping.owner] || 'Sin asignar';
      const leakType = (row[mapping.leakType] || 'OTRO').toUpperCase().replace(/\s+/g, '_');
      const actionPlan = row[mapping.actionPlan] || 'Pendiente de definición';

      const { value: seniority } = sanitizeNumber(row[mapping.seniority] || '5', 'Seniority');
      const { value: saturacionFlota } = sanitizeNumber(row[mapping.saturacionFlota] || '0.5', 'Saturación Flota');
      const { value: bloqueosCriticos } = sanitizeNumber(row[mapping.bloqueosCriticos] || '0.1', 'Bloqueos Críticos');
      const { value: riesgoExterno } = sanitizeNumber(row[mapping.riesgoExterno] || '0.1', 'Riesgo Externo');

      const metadata: Record<string, any> = {};
      Object.keys(row).forEach(key => {
        if (!Object.values(mapping).includes(key)) {
          metadata[key] = row[key];
        }
      });

      nodes.push({
        id,
        name,
        sector,
        riskBase: clampedRisk,
        parents,
        isKilled: false,
        owner,
        leakType,
        actionPlan,
        daily_operation_cost,
        seniority: Math.max(0, seniority),
        saturacionFlota: Math.max(0, Math.min(1, saturacionFlota)),
        bloqueosCriticos: Math.max(0, Math.min(1, bloqueosCriticos)),
        riesgoExterno: Math.max(0, Math.min(1, riesgoExterno)),
        metadata,
      });
    } catch (err) {
      errors.push(`Fila ${index + 2}: Error crítico al procesar - ${(err as Error).message}`);
    }
  });

  return { nodes, errors, warnings };
}