import { useState } from 'react';
import { X, Upload, Check, FileText } from 'lucide-react';
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
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Selecciona un archivo .csv válido.');
      return;
    }
    setFile(selectedFile);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleProcess = () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        try {
          const previewNodes = results.data.map((row: any, index: number) => ({
            id: String(row.id || `csv-${index}`).trim(),
            name: String(row.name || `Nodo ${index + 1}`).trim(),
            sector: String(row.sector || 'OTRO').toUpperCase().trim(),
            riskBase: Math.min(100, Math.max(0, Number(row.riskBase) || 0)),
            daily_operation_cost: Math.max(0, Number(row.daily_operation_cost) || 0),
            parents: row.parents 
              ? String(row.parents).split(';').map((p: string) => p.trim()).filter(Boolean) 
              : [],
            isKilled: false,
            owner: String(row.owner || 'Sin asignar').trim(),
            leakType: String(row.leakType || 'OTRO').toUpperCase().trim(),
            actionPlan: String(row.actionPlan || '').trim(),
            seniority: Math.max(0, Number(row.seniority) || 0),
            saturacionFlota: Math.min(1, Math.max(0, Number(row.saturacionFlota) || 0)),
            bloqueosCriticos: Math.min(1, Math.max(0, Number(row.bloqueosCriticos) || 0)),
            riesgoExterno: Math.min(1, Math.max(0, Number(row.riesgoExterno) || 0)),
            exposedLoss: 0,
            metadata: {},
          }));

          loadCustomNodes(previewNodes);
          setIsLoading(false);
          onClose();
        } catch (err: any) {
          setError('Error de formato: ' + err.message);
          setIsLoading(false);
        }
      },
      error: (err: any) => {
        setError('Error leyendo CSV: ' + err.message);
        setIsLoading(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-red-900/30 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-red-900/20 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><FileText className="text-red-500" /> Importador CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        <div className="p-6 space-y-6">
          {error && <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">{error}</div>}
          <div 
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${isDragging ? 'border-red-500 bg-red-900/10' : 'border-gray-700 hover:border-gray-500'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('csv-input')?.click()}
          >
            <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])} />
            <Upload className={`w-12 h-12 mb-4 ${file ? 'text-green-500' : 'text-gray-500'}`} />
            {file ? <div className="text-green-400 font-medium"><Check size={16} className="inline mr-2" />{file.name}</div> : <><p className="text-gray-300 font-medium">Arrastra tu CSV aquí</p><p className="text-gray-500 text-sm">o haz clic para seleccionar</p></>}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
            <button onClick={handleProcess} disabled={!file || isLoading} className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 ${file && !isLoading ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>
              {isLoading ? 'Procesando...' : <><Upload size={18} /> Importar</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}