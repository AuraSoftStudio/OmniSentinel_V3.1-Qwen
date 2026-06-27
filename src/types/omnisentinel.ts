import { z } from 'zod';

export const ProjectNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sector: z.enum(['LOGISTICA', 'SOFTWARE', 'FINANZAS', 'OTRO']),
  riskBase: z.number().min(0).max(100),
  daily_operation_cost: z.number().min(0),
  parents: z.array(z.string()),
  isKilled: z.boolean().default(false),
  owner: z.string(),
  leakType: z.enum(['TIEMPOS_MUERTOS', 'PENALIZACIONES_DOC', 'FRAGMENTACION_INFO', 'ERROR_HUMANO', 'FALLO_TECNICO', 'OTRO']),
  actionPlan: z.string(),
  seniority: z.number().min(0),
  saturacionFlota: z.number().min(0).max(1),
  bloqueosCriticos: z.number().min(0).max(1),
  riesgoExterno: z.number().min(0).max(1),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
  exposedLoss: z.number().optional(),
});

export type ProjectNode = z.infer<typeof ProjectNodeSchema>;

export type SimulationRange = {
  min: number;
  max: number;
  distribution: 'UNIFORM' | 'NORMAL';
};

export type CurrencyCode = 'USD' | 'CLP';
export type ViewMode = 'WAR_ROOM' | 'EXECUTIVE';
export type DataSource = 'SHEETS' | 'TEMPLATE' | 'CSV_IMPORT';