// src/core/montecarlo.worker.ts
import { expose } from 'comlink';
import type { ProjectNode } from '../services/dataParser';

export interface SimulationRange {
  min: number;
  max: number;
  distribution: 'UNIFORM' | 'NORMAL';
}

export interface MonteCarloInput {
  nodes: ProjectNode[];
  iterations: number;
  ranges: {
    inflation: SimulationRange;
    capacity: SimulationRange;
    responseTime: SimulationRange;
    failureRate: SimulationRange;
    penalty: SimulationRange;
  };
}

export interface MonteCarloResult {
  mean: number;
  p50: number;
  p90: number;
  p99: number;
  worstCase: number;
  bestCase: number;
  histogram: number[];
}

// Generador de números aleatorios con Distribución Normal (Box-Muller)
function randomNormal(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return num * stdDev + mean;
}

// Generador Uniforme
function randomUniform(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Lógica simplificada de V-CORE para iteraciones masivas
function calculateSingleIteration(nodes: ProjectNode[], vars: { inflation: number, capacity: number, responseTime: number, failureRate: number, penalty: number }): number {
  let totalLoss = 0;
  
  for (const node of nodes) {
    if (node.isKilled) continue;

    // Aplicar inflación
    let cost = node.daily_operation_cost * (1 + vars.inflation / 100);
    
    // Aplicar penalizaciones si es nodo de fuga tipo PENALIZACION
    const isPenaltyNode = node.leakType.includes('PENALIZACION');
    if (isPenaltyNode) cost *= vars.penalty;

    // Calcular riesgo base simulado
    let risk = node.riskBase;
    
    // Estrés por capacidad reducida
    if (vars.capacity < 100) {
      risk += (100 - vars.capacity) * 0.5;
    }
    
    // Estrés por tasa de fallo
    if (vars.failureRate > 0 && risk > 60) {
      risk += vars.failureRate;
    }

    risk = Math.max(0, Math.min(100, risk));
    
    // Pérdida expuesta en esta iteración
    totalLoss += cost * (risk / 100);
  }
  
  return totalLoss;
}

export function runMonteCarloSimulation(input: MonteCarloInput): MonteCarloResult {
  const { nodes, iterations, ranges } = input;
  const results: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    // Generar variables aleatorias según la distribución
    const inflation = ranges.inflation.distribution === 'NORMAL' 
      ? randomNormal((ranges.inflation.min + ranges.inflation.max) / 2, (ranges.inflation.max - ranges.inflation.min) / 6)
      : randomUniform(ranges.inflation.min, ranges.inflation.max);
      
    const capacity = ranges.capacity.distribution === 'NORMAL'
      ? randomNormal((ranges.capacity.min + ranges.capacity.max) / 2, (ranges.capacity.max - ranges.capacity.min) / 6)
      : randomUniform(ranges.capacity.min, ranges.capacity.max);
      
    const responseTime = randomUniform(ranges.responseTime.min, ranges.responseTime.max);
    const failureRate = randomUniform(ranges.failureRate.min, ranges.failureRate.max);
    const penalty = randomUniform(ranges.penalty.min, ranges.penalty.max);

    const loss = calculateSingleIteration(nodes, { inflation, capacity, responseTime, failureRate, penalty });
    results.push(loss);
  }

  // Ordenar para calcular percentiles
  results.sort((a, b) => a - b);
  
  const getPercentile = (p: number) => results[Math.floor((p / 100) * results.length)];
  
  // Crear histograma simple (10 bins)
  const min = results[0];
  const max = results[results.length - 1];
  const binSize = (max - min) / 10;
  const histogram = new Array(10).fill(0);
  
  for (const val of results) {
    let binIndex = Math.floor((val - min) / binSize);
    if (binIndex >= 10) binIndex = 9;
    histogram[binIndex]++;
  }

  return {
    mean: results.reduce((a, b) => a + b, 0) / iterations,
    p50: getPercentile(50),
    p90: getPercentile(90),
    p99: getPercentile(99),
    worstCase: max,
    bestCase: min,
    histogram
  };
}

expose({ runMonteCarloSimulation });