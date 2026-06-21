// src/config/actionPlans.js
import { getTriggerValue, evaluateTrigger } from './triggerHelpers';

/**
 * Tactical Action Plans Matrix
 * Structure: { SECTOR: { STATUS: [ { id, name, triggers, impact, time, cost } ] } }
 * Triggers use the evaluateTrigger format: { field, operator, value }
 * AND logic is applied within an array. OR would require separate plan entries.
 */
export const ACTION_PLANS = {
  LOGISTICA: {
    MONITORING: [
      { id: 'LOG-MON-01', name: 'route_diversification_prep', triggers: [
        { field: 'simRisk', operator: '>', value: 40 },
        { field: 'daily_operation_cost', operator: '>', value: 500 }
      ], impact: '15-25% exposure reduction', time: '2-4 hours', cost: 'LOW' },
      { id: 'LOG-MON-02', name: 'secondary_supplier_activation', triggers: [
        { field: 'isSingleParent', operator: '===', value: true },
        { field: 'supplier_risk', operator: '>', value: 45 }
      ], impact: '20-30% vulnerability reduction', time: '24-48 hours', cost: 'MEDIUM' },
      { id: 'LOG-MON-03', name: 'dynamic_inventory_buffer', triggers: [
        { field: 'demand_variability', operator: '>', value: 30 },
        { field: 'stock_days', operator: '<', value: 15 }
      ], impact: '10-20% stockout reduction', time: '4-12 hours', cost: 'MEDIUM' }
    ],
    CRITICAL: [
      { id: 'LOG-CRIT-01', name: 'logistic_kill_switch', triggers: [
        { field: 'simRisk', operator: '>', value: 70 },
        { field: 'dailyLoss', operator: '>', value: 5000 }
      ], impact: '40-60% immediate loss reduction', time: '<1 hour', cost: 'MEDIUM' },
      { id: 'LOG-CRIT-02', name: 'emergency_rerouting', triggers: [
        { field: 'delivery_time', operator: '>', value: 2 }, // relative to SLA baseline
        { field: 'simRisk', operator: '>', value: 75 }
      ], impact: '35-50% penalty reduction', time: '4-8 hours', cost: 'HIGH' },
      { id: 'LOG-CRIT-03', name: 'freeze_non_critical_orders', triggers: [
        { field: 'capacity_pct', operator: '<', value: 40 },
        { field: 'backlog_pct', operator: '>', value: 200 }
      ], impact: '25-40% critical resource preservation', time: '<2 hours', cost: 'LOW' }
    ],
    COLLAPSE: [
      { id: 'LOG-COLL-01', name: 'operational_survival_mode', triggers: [
        { field: 'simRisk', operator: '>', value: 95 },
        { field: 'dailyLoss', operator: '>', value: 50000 }
      ], impact: '60-80% financial damage containment', time: '<30 minutes', cost: 'HIGH' },
      { id: 'LOG-COLL-02', name: 'contagion_isolation', triggers: [
        { field: 'affectedChildrenCount', operator: '>', value: 3 },
        { field: 'delivery_time', operator: '>', value: 120 } // minutes
      ], impact: '70-90% chain collapse prevention', time: '<15 minutes', cost: 'HIGH' },
      { id: 'LOG-COLL-03', name: 'external_crisis_protocol_activation', triggers: [
        { field: 'dailyLoss', operator: '>', value: 100000 }
      ], impact: '50-75% recovery time reduction', time: '1-3 hours', cost: 'HIGH' }
    ]
  },
  SOFTWARE: {
    MONITORING: [
      { id: 'SW-MON-01', name: 'preventive_resource_scaling', triggers: [
        { field: 'cpu_usage', operator: '>', value: 60 },
        { field: 'latency_p95', operator: '>', value: 500 }
      ], impact: '20-30% downtime risk reduction', time: '1-2 hours', cost: 'LOW' },
      { id: 'SW-MON-02', name: 'feature_flag_activation', triggers: [
        { field: 'error_rate', operator: '>', value: 2 },
        { field: 'system_load', operator: '>', value: 45 }
      ], impact: '25-35% user impact reduction', time: '<30 minutes', cost: 'LOW' },
      { id: 'SW-MON-03', name: 'adaptive_rate_limiting', triggers: [
        { field: 'traffic_peak_pct', operator: '>', value: 150 },
        { field: 'latency_p95', operator: '>', value: 500 }
      ], impact: '15-25% saturation prevention', time: '<15 minutes', cost: 'LOW' }
    ],
    CRITICAL: [
      { id: 'SW-CRIT-01', name: 'automatic_circuit_breaker', triggers: [
        { field: 'failure_rate', operator: '>', value: 70 },
        { field: 'critical_deps', operator: '>', value: 2 }
      ], impact: '50-70% failure cascade prevention', time: '<5 minutes', cost: 'MEDIUM' },
      { id: 'SW-CRIT-02', name: 'deployment_rollback', triggers: [
        { field: 'simRisk', operator: '>', value: 75 },
        { field: 'affectedChildrenCount', operator: '>', value: 1000 }
      ], impact: '60-80% stability recovery', time: '10-30 minutes', cost: 'MEDIUM' },
      { id: 'SW-CRIT-03', name: 'controlled_degradation', triggers: [
        { field: 'system_load', operator: '>', value: 85 },
        { field: 'critical_resources_pct', operator: '<', value: 20 }
      ], impact: '30-45% core functionality preservation', time: '<10 minutes', cost: 'LOW' }
    ],
    COLLAPSE: [
      { id: 'SW-COLL-01', name: 'controlled_degraded_mode', triggers: [
        { field: 'availability', operator: '<', value: 50 },
        { field: 'dailyLoss', operator: '>', value: 10000 }
      ], impact: '70-85% critical function preservation', time: '<10 minutes', cost: 'HIGH' },
      { id: 'SW-COLL-02', name: 'failover_to_backup_infra', triggers: [
        { field: 'availability', operator: '<', value: 20 },
        { field: 'system_load', operator: '>', value: 90 }
      ], impact: '80-95% operational continuity', time: '5-20 minutes', cost: 'HIGH' },
      { id: 'SW-COLL-03', name: 'compromised_microservice_isolation', triggers: [
        { field: 'error_rate', operator: '>', value: 90 },
        { field: 'latency_p95', operator: '>', value: 10000 }
      ], impact: '65-80% systemic failure containment', time: '<5 minutes', cost: 'MEDIUM' }
    ]
  },
  FINANZAS: {
    MONITORING: [
      { id: 'FIN-MON-01', name: 'dynamic_exposure_limit', triggers: [
        { field: 'market_volatility', operator: '>', value: 40 },
        { field: 'concentrated_exposure', operator: '>', value: 100000 }
      ], impact: '15-25% loss risk reduction', time: '1-4 hours', cost: 'LOW' },
      { id: 'FIN-MON-02', name: 'automatic_portfolio_rebalancing', triggers: [
        { field: 'asset_correlation', operator: '>', value: 0.8 },
        { field: 'simRisk', operator: '>', value: 50 }
      ], impact: '20-30% concentrated exposure mitigation', time: '4-12 hours', cost: 'MEDIUM' },
      { id: 'FIN-MON-03', name: 'preventive_liquidity_alert', triggers: [
        { field: 'cash_flow_days', operator: '<', value: 30 },
        { field: 'cash_outflows', operator: '>', value: 50000 }
      ], impact: '10-20% cash stress prevention', time: '2-6 hours', cost: 'LOW' }
    ],
    CRITICAL: [
      { id: 'FIN-CRIT-01', name: 'freeze_high_risk_transactions', triggers: [
        { field: 'default_probability', operator: '>', value: 70 },
        { field: 'daily_operation_cost', operator: '>', value: 50000 }
      ], impact: '45-65% credit loss prevention', time: '<1 hour', cost: 'MEDIUM' },
      { id: 'FIN-CRIT-02', name: 'emergency_hedge_activation', triggers: [
        { field: 'dailyLoss', operator: '>', value: 100000 },
        { field: 'volatility_sigma', operator: '>', value: 3 }
      ], impact: '50-70% capital protection', time: '1-4 hours', cost: 'HIGH' },
      { id: 'FIN-CRIT-03', name: 'internal_credit_restriction', triggers: [
        { field: 'aggregated_exposure', operator: '>', value: 80 },
        { field: 'counterparty_risk', operator: '>', value: 65 }
      ], impact: '35-50% systemic risk reduction', time: '<2 hours', cost: 'MEDIUM' }
    ],
    COLLAPSE: [
      { id: 'FIN-COLL-01', name: 'liquidity_containment_protocol', triggers: [
        { field: 'liquidity_ratio', operator: '<', value: 1.0 },
        { field: 'cash_outflows', operator: '>', value: 500000 }
      ], impact: '65-85% operational cash preservation', time: '<30 minutes', cost: 'HIGH' },
      { id: 'FIN-COLL-02', name: 'counterparty_default_isolation', triggers: [
        { field: 'credit_contagion_count', operator: '>', value: 3 },
        { field: 'total_exposure', operator: '>', value: 1000000 }
      ], impact: '75-90% systemic loss containment', time: '<15 minutes', cost: 'HIGH' },
      { id: 'FIN-COLL-03', name: 'emergency_credit_line_activation', triggers: [
        { field: 'net_cash', operator: '<', value: 0 },
        { field: 'immediate_obligations', operator: '>', value: 200000 }
      ], impact: '55-75% technical insolvency prevention', time: '1-6 hours', cost: 'HIGH' }
    ]
  }
};

/**
 * Returns applicable action plans for a given node
 */
export const getApplicableActions = (node) => {
  const sector = node.sector || 'LOGISTICA';
  const status = node.status || 'MONITORING';
  
  // Map UI status to config keys
  const statusKey = status === 'MONITOREO' ? 'MONITORING' : 
                    status === 'CRÍTICO' || status === 'CRITICO' ? 'CRITICAL' :
                    status === 'COLAPSO' ? 'COLLAPSE' : 'MONITORING';

  const plans = ACTION_PLANS[sector]?.[statusKey] || [];
  return plans.filter(plan => {
    // All triggers must pass (AND logic)
    return plan.triggers.every(t => evaluateTrigger(node, t));
  });
};