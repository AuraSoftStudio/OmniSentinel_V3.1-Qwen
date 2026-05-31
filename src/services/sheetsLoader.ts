// src/services/sheetsLoader.ts
import { z } from 'zod';
import { ProjectNodeSchema, type ProjectNode } from '../types/omnisentinel';

// ⚠️ IMPORTANTE: Reemplaza esta URL con la de tu Google Sheet publicado como CSV
// Para obtenerla: File > Share > Publish to web > Select "Comma-separated values (.csv)"
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTvyW5rgzdxFWXLb4uB-ICSeOm4NDcw8lIqQmAyE2FtYPFHB8ROWQ8UjQR2NucWsCjiNHkcbebmCKsw/pub?output=csv';

// Función auxiliar simple para parsear CSV (sin librerías externas pesadas)
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
  
  return lines.slice(1).map(line => {
    // Manejo básico de comas dentro de celdas no implementado por simplicidad MVP
    // Asumimos que los datos no tienen comas internas o están bien escapados
    const values = line.split(',').map(v => v.trim().replace(/\r/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });
    return row;
  });
}

export async function loadFromSheets(): Promise<ProjectNode[]> {
  try {
    // Nota: En producción real, esto debería hacerse vía un backend proxy para evitar CORS
    // Para MVP local, usamos fetch directo. Si falla por CORS, usa una extensión de navegador o un proxy público temporal.
    const response = await fetch(SHEET_CSV_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sheets: ${response.status}`);
    }
    
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    console.log("Filas crudas leídas:", rows.length);

    // Mapeo de columnas de Sheets a nuestro Schema de Omnisentinel
    const mappedRows = rows.map(row => ({
      id: row.ID_NODO || crypto.randomUUID(),
      name: row.NOMBRE || 'Nodo sin nombre',
      sector: (row.SECTOR?.toUpperCase() || 'LOGISTICA') as any,
      riskBase: Number(row.RIESGO_BASE_PCT) || 0,
      // Asumimos que las dependencias vienen separadas por punto y coma en la celda
      parents: row.DEPENDENCIAS ? row.DEPENDENCIAS.split(';').map(s => s.trim()).filter(Boolean) : [],
      isKilled: row.KILL_SWITCH?.toUpperCase() === 'TRUE' || row.KILL_SWITCH === '1',
      owner: row.RESPONSABLE || 'Sin asignar',
      leakType: (row.TIPO_FUGA?.toUpperCase() || 'OTRO') as any,
      actionPlan: row.PLAN_ACCION || 'Pendiente de definir',
      financialImpact: {
        dailyLoss: Number(row.PERDIDA_DIARIA) || 0,
        monthlyLoss: Number(row.PERDIDA_MENSUAL) || 0,
        yearlyLoss: Number(row.PERDIDA_ANUAL) || 0,
        currency: (row.MONEDA?.toUpperCase() || 'USD') as any
      },
      jiraTicketId: row.JIRA_KEY || undefined
    }));
    
    // Validación masiva con Zod
    const result = z.array(ProjectNodeSchema).safeParse(mappedRows);
    
    if (!result.success) {
      console.error('❌ Errores de validación en carga de Sheets:', result.error.format());
      // En un MVP, podríamos devolver solo los válidos o lanzar error
      // Aquí devolvemos array vacío para indicar fallo crítico de estructura
      return [];
    }
    
    console.log("✅ Nodos validados correctamente:", result.data.length);
    return result.data;
  } catch (error) {
    console.error('❌ Error cargando desde Sheets:', error);
    throw error;
  }
}