// src/config/triggerHelpers.js

/**
 * Helper functions to safely access node properties for action triggers.
 * Keeps business logic isolated from UI and prevents NaN/undefined errors.
 */
export const getTriggerValue = (node, key) => {
  switch (key) {
    case 'simRisk': return node.simRisk ?? 0;
    case 'daily_operation_cost': return node.daily_operation_cost ?? 0;
    case 'dailyLoss': return node.dailyLoss ?? 0;
    case 'parentCount': return (node.parents || []).length;
    case 'affectedChildrenCount': return node.metadata?.affectedChildrenCount ?? 0;
    case 'isSingleParent': return (node.parents || []).length === 1;
    // Sector-specific metadata extensions
    case 'supplier_risk': return node.metadata?.supplier_risk ?? 0;
    case 'demand_variability': return node.metadata?.demand_variability ?? 0;
    case 'stock_days': return node.metadata?.stock_days ?? 0;
    case 'delivery_time': return node.metadata?.delivery_time ?? 0;
    case 'capacity_pct': return node.metadata?.capacity_pct ?? 100;
    case 'backlog_pct': return node.metadata?.backlog_pct ?? 0;
    case 'cpu_usage': return node.metadata?.cpu_usage ?? 0;
    case 'latency_p95': return node.metadata?.latency_p95 ?? 0;
    case 'error_rate': return node.metadata?.error_rate ?? 0;
    case 'traffic_peak_pct': return node.metadata?.traffic_peak_pct ?? 0;
    case 'failure_rate': return node.metadata?.failure_rate ?? 0;
    case 'critical_deps': return node.metadata?.critical_deps ?? 0;
    case 'system_load': return node.metadata?.system_load ?? 0;
    case 'critical_resources_pct': return node.metadata?.critical_resources_pct ?? 100;
    case 'availability': return node.metadata?.availability ?? 100;
    case 'market_volatility': return node.metadata?.market_volatility ?? 0;
    case 'concentrated_exposure': return node.metadata?.concentrated_exposure ?? 0;
    case 'asset_correlation': return node.metadata?.asset_correlation ?? 0;
    case 'cash_flow_days': return node.metadata?.cash_flow_days ?? 0;
    case 'cash_outflows': return node.metadata?.cash_outflows ?? 0;
    case 'default_probability': return node.metadata?.default_probability ?? 0;
    case 'volatility_sigma': return node.metadata?.volatility_sigma ?? 0;
    case 'aggregated_exposure': return node.metadata?.aggregated_exposure ?? 0;
    case 'counterparty_risk': return node.metadata?.counterparty_risk ?? 0;
    case 'liquidity_ratio': return node.metadata?.liquidity_ratio ?? 0;
    case 'credit_contagion_count': return node.metadata?.credit_contagion_count ?? 0;
    case 'total_exposure': return node.metadata?.total_exposure ?? 0;
    case 'net_cash': return node.metadata?.net_cash ?? 0;
    case 'immediate_obligations': return node.metadata?.immediate_obligations ?? 0;
    default: return 0;
  }
};

/**
 * Evaluates a trigger condition object against a node.
 * Format: { field: string, operator: '>' | '<' | '>=' | '<=' | '===', value: number }
 */
export const evaluateTrigger = (node, condition) => {
  const nodeVal = getTriggerValue(node, condition.field);
  const triggerVal = condition.value;

  switch (condition.operator) {
    case '>': return nodeVal > triggerVal;
    case '<': return nodeVal < triggerVal;
    case '>=': return nodeVal >= triggerVal;
    case '<=': return nodeVal <= triggerVal;
    case '===': return nodeVal === triggerVal;
    default: return false;
  }
};