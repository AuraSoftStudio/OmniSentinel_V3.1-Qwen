// src/services/vcoreService.ts
import { wrap } from 'comlink';

// Asegúrate de que la ruta sea correcta. 
// El worker debe estar en src/core/vcore.worker.ts
const workerUrl = new URL('../core/vcore.worker.ts', import.meta.url);
const worker = new Worker(workerUrl, { type: 'module' });

// El tipado correcto para evitar Remote<unknown>
export const vcoreWorker = wrap<typeof import('../core/vcore.worker')>(worker);