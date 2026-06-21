// src/components/DataImporter.tsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, UploadCloud, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { useOmnisentinelStore } from '../hooks/useOmnisentinelStore';
import { 
  parseCSVContent, 
  autoDetectMapping, 
  transformToProjectNodes,
  INTERNAL_FIELDS,
  type ProjectNode
} from '../services/dataParser';

interface DataImporterProps {
  onClose: () => void;
}

type ImportStep = 'drop' | 'mapping' | 'review' | 'done';

export default function DataImporter({ onClose }: DataImporterProps) {
  const loadCustomNodes = useOmnisentinelStore(state => state.loadCustomNodes);
  
  const [step, setStep] = useState<ImportStep>('drop');
  const [fileName, setFileName] = useState('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [transformErrors, setTransformErrors] = useState<string[]>([]);
  const [transformWarnings, setTransformWarnings] = useState<string[]>([]);
  const [previewNodes, setPreviewNodes] = useState<ProjectNode[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const { headers, rows, errors } = parseCSVContent(content);
      
      if (errors.length > 0) {
        console.error('CSV Parse errors:', errors);
        return;
      }
      
      setRawHeaders(headers);
      setRawRows(rows);
      
      const detectedMapping = autoDetectMapping(headers);
      setMapping(detectedMapping);
      
      setStep('mapping');
    };
    
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  });

  const handleMappingChange = (field: string, csvColumn: string) => {
    setMapping(prev => ({ ...prev, [field]: csvColumn }));
  };

  const handleValidate = () => {
    const { nodes, errors, warnings } = transformToProjectNodes(rawRows, mapping);
    
    setTransformErrors(errors);
    setTransformWarnings(warnings);
    setPreviewNodes(nodes);
    setStep('review');
  };

  const handleImport = () => {
    if (transformErrors.length > 0) {
      alert('Corrige los errores críticos antes de importar.');
      return;
    }
    
    loadCustomNodes(previewNodes);
    setStep('done');
    
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const requiredFieldsMapped = INTERNAL_FIELDS
    .filter(f => f.required)
    .every(f => mapping[f.key]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0a] border border-red-900/30 rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-red-900/30 flex justify-between items-center bg-gradient-to-r from-red-950/20 to-transparent">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="text-red-500" /> 
            Importador de Datos Universal
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          
          {step === 'drop' && (
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all ${
                isDragActive 
                  ? 'border-red-500 bg-red-950/20' 
                  : 'border-gray-700 hover:border-red-500/50 hover:bg-red-950/10'
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-20 h-20 mx-auto mb-4 text-gray-500" />
              <p className="text-xl text-gray-300 font-medium mb-2">
                Arrastra tu archivo CSV aquí
              </p>
              <p className="text-sm text-gray-500">
                o haz clic para seleccionar
              </p>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-blue-950/20 border border-blue-500/30 rounded-lg">
                <CheckCircle className="text-blue-400" />
                <div>
                  <p className="text-white font-medium">{fileName}</p>
                  <p className="text-xs text-gray-400">{rawRows.length} filas detectadas, {rawHeaders.length} columnas</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                  Mapeo de Columnas
                </h3>
                <div className="space-y-3">
                  {INTERNAL_FIELDS.map(field => (
                    <div key={field.key} className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-sm text-gray-300 flex items-center gap-2">
                          {field.label}
                          {field.required && <span className="text-red-500">*</span>}
                        </label>
                      </div>
                      <div className="flex-1">
                        <select
                          value={mapping[field.key] || ''}
                          onChange={(e) => handleMappingChange(field.key, e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                        >
                          <option value="">-- No mapear --</option>
                          {rawHeaders.map(header => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setStep('drop')}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={handleValidate}
                  disabled={!requiredFieldsMapped}
                  className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
                    !requiredFieldsMapped
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50'
                  }`}
                >
                  Validar y Previsualizar
                </button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-950/20 border border-green-500/30 rounded-lg">
                  <p className="text-2xl font-bold text-green-400">{previewNodes.length}</p>
                  <p className="text-xs text-gray-400">Nodos válidos</p>
                </div>
                <div className="p-4 bg-yellow-950/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-400">{transformWarnings.length}</p>
                  <p className="text-xs text-gray-400">Advertencias</p>
                </div>
                <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-lg">
                  <p className="text-2xl font-bold text-red-400">{transformErrors.length}</p>
                  <p className="text-xs text-gray-400">Errores críticos</p>
                </div>
              </div>

              {transformErrors.length > 0 && (
                <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-lg">
                  <h4 className="text-red-400 font-bold flex items-center gap-2 mb-2">
                    <AlertCircle size={18} /> Errores Críticos
                  </h4>
                  <ul className="list-disc list-inside text-sm text-red-200 space-y-1 max-h-32 overflow-y-auto">
                    {transformErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={handleImport}
                  disabled={transformErrors.length > 0}
                  className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
                    transformErrors.length > 0
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50'
                  }`}
                >
                  <UploadCloud size={18} /> Importar {previewNodes.length} Nodos
                </button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-16">
              <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Importación Exitosa</h3>
              <p className="text-gray-400">{previewNodes.length} nodos cargados al sistema</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}