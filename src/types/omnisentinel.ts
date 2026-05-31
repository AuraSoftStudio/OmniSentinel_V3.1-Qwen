// src/types/omnisentinel.ts
import { z } from 'zod';

// 🚚 Catálogo de Fugas: Logística (Basado en tu análisis de mercado)
export const LogisticsLeaks = [
  'FRAGMENTACION_INFO', 'ORDENES_DUPLICADAS', 'TIEMPOS_MUERTOS', 
  'PENALIZACIONES_DOC', 'FALTA_TRAZABILIDAD', 'SOBRECOSTOS_PROVEEDOR'
] as const;

// 💻 Catálogo de Fugas: Software
export const SoftwareLeaks = [
  'DEUDA_TECNICA', 'CLOUD_INEFICIENTE', 'VULNERABILIDAD_LATENTE', 
  'ESCALABILIDAD', 'UX_DEFICIENTE', 'DESALINEACION_PROCESOS'
] as const;

export const LeakTypeEnum = z.enum([...LogisticsLeaks, ...SoftwareLeaks, 'OTRO']);
export type LeakType = z.infer<typeof LeakTypeEnum>;

// 💰 Impacto Financiero (El lenguaje del CFO)
export const FinancialImpactSchema = z.object({
  dailyLoss: z.number().min(0),
  monthlyLoss: z.number().min(0),
  yearlyLoss: z.number().min(0),
  currency: z.enum(['USD', 'EUR', 'MXN']).default('USD')
});
export type FinancialImpact = z.infer<typeof FinancialImpactSchema>;

// 🕸️ El Nodo Unificado (Data Contract)
export const ProjectNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sector: z.enum(['LOGISTICA', 'SOFTWARE', 'RRHH', 'FINANZAS', 'TI']),
  riskBase: z.number().min(0).max(100),
  
  // Topología
  parents: z.array(z.string()).default([]),
  isKilled: z.boolean().default(false),
  
  // 💼 Negocio y Accionabilidad (Lo que exige el mercado)
  owner: z.string().min(1, "Todo nodo debe tener un responsable (Owner)"),
  leakType: LeakTypeEnum,
  actionPlan: z.string().min(1, "Debe haber un plan de acción sugerido"),
  financialImpact: FinancialImpactSchema,
  
  // Metadatos de Integración
  jiraTicketId: z.string().optional(),
});

export type ProjectNode = z.infer<typeof ProjectNodeSchema>;