// src/components/DataImporter.tsx
import { useState } from 'react';
import { X, Upload, Check, AlertTriangle, FileText } from 'lucide-react';
import { useOmnisentinelStore } from '../hooks/useOmnisentinelStore';
import Papa from 'papaparse';

interface DataImporterProps {
  onClose: () => void;
}

export default function DataImporter({ onClose }: DataImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { loadCustomNodes } = useOmnisentinelStore();

  const handleFileSelect = (selectedFile: File) => {
    console.log('📁 Archivo seleccionado:', selectedFile.name);
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Por favor, selecciona un archivo CSV válido.');
      return;
    }
    setFile(selectedFile);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleProcess = () => {
    if (!file) {
      setError('No hay archivo seleccionado');
      return;
    }

    console.log('🔄 Iniciando procesamiento del CSV...');
    setIsLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        console.log('✅ CSV parseado. Filas encontradas:', results.data.length);
        
        try {
          const previewNodes = results.data.map((row: any, index: number) => {
            console.log(`Fila ${index}:`, row);
            return {
              id: row.id || `csv-${index}`,
              name: row.name || 'Nodo sin nombre',
              sector: (row.sector || 'OTRO').toUpperCase(),
              riskBase: Number(row.riskBase) || 0,
              daily_operation_cost: Number(row.daily_operation_cost) || 0,
              parents: row.parents ? row.parents.split(';').map((p: string) => p.trim()) : [],
              isKilled: false,
              owner: row.owner || 'Sin asignar',
              leakType: (row.leakType || 'OTRO').toUpperCase(),
              actionPlan: row.actionPlan || '',
              seniority: Number(row.seniority) || 0,
              saturacionFlota: Number(row.saturacionFlota) || 0,
              bloqueosCriticos: Number(row.bloqueosCriticos) || 0,
              riesgoExterno: Number(row.riesgoExterno) || 0,
              metadata: {},
            };
          });

          console.log('📦 Nodos procesados:', previewNodes.length);
          console.log('Primer nodo:', previewNodes[0]);

          // Cargar en el store
          console.log('🚀 Cargando nodos en el store...');
          loadCustomNodes(previewNodes as any);
          
          setIsLoading(false);
          onClose();
          
          alert(`✅ Importación exitosa: ${previewNodes.length} nodos cargados`);
        } catch (err: any) {
          console.error('❌ Error procesando nodos:', err);
          setError('Error al procesar los datos: ' + err.message);
          setIsLoading(false);
        }
      },
      error: (err: any) => {
        console.error('❌ Error en Papa.parse:', err);
        setError('Error al leer el archivo CSV: ' + err.message);
        setIsLoading(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-red-900/30 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
        
        <div className="p-6 border-b border-red-900/20 flex justify-between items-center bg-gradient-to-r from-red-900/10 to-transparent">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="text-red-500" /> Importador de Datos Universal
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <div 
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              isDragging ? 'border-red-500 bg-red-900/10' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('csv-input')?.click()}
          >
            <input 
              id="csv-input" 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            />
            <Upload className={`w-12 h-12 mb-4 ${file ? 'text-green-500' : 'text-gray-500'}`} />
            {file ? (
              <div className="text-green-400 font-medium flex items-center gap-2">
                <Check size={16} /> {file.name} listo para importar
              </div>
            ) : (
              <>
                <p className="text-gray-300 font-medium mb-1">Arrastra tu archivo CSV aquí</p>
                <p className="text-gray-500 text-sm">o haz clic para seleccionar</p>
              </>
            )}
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 text-sm text-gray-400 space-y-2">
            <p className="font-bold text-gray-200 mb-2">📋 Columnas requeridas del CSV:</p>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div>✓ id (Texto único)</div>
              <div>✓ name (Nombre del nodo)</div>
              <div>✓ sector (LOGISTICA/SOFTWARE/FINANZAS/OTRO)</div>
              <div>✓ riskBase (0-100)</div>
              <div>✓ daily_operation_cost (Número)</div>
              <div>• parents (IDs separados por ;)</div>
              <div>• owner (Responsable)</div>
              <div>• leakType (Tipo de fuga)</div>
              <div>• actionPlan (Plan de acción)</div>
              <div>• seniority (Años)</div>
              <div>• saturacionFlota (0-1)</div>
              <div>• bloqueosCriticos (0-1)</div>
              <div>• riesgoExterno (0-1)</div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              onClick={onClose} 
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button 
              onClick={handleProcess} 
              disabled={!file || isLoading}
              className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
                file && !isLoading
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50' 
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload size={18} /> Importar Datos
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}