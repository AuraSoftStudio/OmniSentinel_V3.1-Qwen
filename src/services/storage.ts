// src/services/storage.ts
import { get, set, del } from 'idb-keyval';

// Adaptador de storage para Zustand usando IndexedDB
export const idbStorage = {
  getItem: async (name: string) => {
    const value = await get(name);
    return value === undefined ? null : value;
  },
  setItem: async (name: string, value: any) => {
    await set(name, value);
  },
  removeItem: async (name: string) => {
    await del(name);
  },
};

// Utilidades para Backup Manual (JSON)
export const exportProject = (state: any) => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `omnisentinel_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importProject = async (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        // Validación básica de estructura
        if (!json.rawNodes || !Array.isArray(json.rawNodes)) {
          throw new Error('Formato de backup inválido: falta "rawNodes"');
        }
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });
};