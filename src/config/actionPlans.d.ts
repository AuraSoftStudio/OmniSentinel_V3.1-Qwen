// src/config/actionPlans.d.ts
export interface ActionPlan {
  id: string;
  name: string;
  triggers: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  impact: string;
  time: string;
  cost: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const ACTION_PLANS: Record<string, Record<string, ActionPlan[]>>;
export function getApplicableActions(node: any): ActionPlan[];