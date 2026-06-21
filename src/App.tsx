// src/App.tsx
import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { 
  RefreshCw, 
  FileDown, 
  Upload,
  Sliders,
  ShieldAlert,
  HardDriveDownload,
  HardDriveUpload,
  Loader2
} from 'lucide-react';

import { useOmnisentinelStore } from './hooks/useOmnisentinelStore';
import { NodeCard } from './components/ui/NodeCard';
import { ExecutiveSummary } from './components/executive/ExecutiveSummary';
import DataImporter from './components/DataImporter';
import SimulatorPanel from './components/SimulatorPanel';
import NodeDetailDrawer from './components/NodeDetailDrawer';

const LossRadarReport = lazy(() => 
  import('./components/executive/LossRadarReport').then(module => ({ 
    default: module.LossRadarReport 
  }))
);

function App() {
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    processedNodes, 
    rawNodes,
    init, 
    isLoading, 
    isCalculating,
    viewMode, 
    setViewMode,
    selectedNodeId,
    setSelectedNode,
    handleExportProject,
    handleImportProject,
    graphErrors
  } = useOmnisentinelStore();

  useEffect(() => {
    setIsMounted(true);
    init();
  }, [init]);

  const handleDownloadPdf = async () => {
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { saveAs } = await import('file-saver');

      const doc = (
        <Suspense fallback={null}>
          <LossRadarReport />
        </Suspense>
      );
      
      const asBlob = await pdf(doc).toBlob();
      saveAs(asBlob, 'Omnisentinel_Loss_Radar_Report.pdf');
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Hubo un error al generar el reporte.");
    }
  };

  const triggerImportBackup = () => {
    fileInputRef.current?.click();
  };

  const onImportBackupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportProject(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-red-600 mx-auto mb-4 animate-pulse" />
          <div className="text-red-500 text-xl font-mono animate-pulse">
            INICIALIZANDO OMNISENTINEL...
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-red-500 mx-auto mb-4 animate-spin" />
          <div className="text-red-500 text-xl font-mono animate-pulse">
            CARGANDO DATOS...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans relative">
      
      {isCalculating && (
        <div className="fixed top-24 right-6 bg-black/90 backdrop-blur-md border border-yellow-500/50 rounded-lg p-3 flex items-center gap-3 z-50 shadow-lg shadow-yellow-900/20 animate-in fade-in slide-in-from-top-2">
          <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
          <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">Procesando nodos...</span>
        </div>
      )}

      <header className="p-6 border-b border-red-900/30 bg-[#0a0a0a] sticky top-0 z-40">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          
          <div className="flex items-center gap-4">
            {!logoError ? (
              <img 
                src="/logo.png" 
                alt="Omnisentinel" 
                className="h-14 w-auto object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="h-14 w-14 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center border-2 border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.6)]">
                <span className="text-white font-bold text-lg">OS</span>
              </div>
            )}
            
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white uppercase flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-red-500" />
                Omnisentinel <span className="text-red-500">V3.3</span>
              </h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">
                Motor Táctico Predictivo de Colapso Operacional
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setIsImporterOpen(true)} className="px-3 py-2 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 border border-blue-500/30 rounded text-sm font-medium transition-colors flex items-center gap-2">
              <Upload className="w-4 h-4" /> Importar CSV
            </button>
            
            <button onClick={() => setIsSimulatorOpen(true)} className="px-3 py-2 bg-purple-900/20 hover:bg-purple-900/40 text-purple-400 border border-purple-500/30 rounded text-sm font-medium transition-colors flex items-center gap-2">
              <Sliders className="w-4 h-4" /> Simulador
            </button>
            
            <button onClick={init} className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 border border-neutral-700 rounded text-sm font-medium transition-colors flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Recargar
            </button>

            <div className="flex items-center gap-1 px-2 py-1 bg-black/40 rounded border border-gray-800">
              <button 
                onClick={handleExportProject} 
                className="p-1.5 text-gray-400 hover:text-green-400 transition-colors rounded hover:bg-white/5"
                title="Exportar Backup JSON"
              >
                <HardDriveDownload className="w-4 h-4" />
              </button>
              <button 
                onClick={triggerImportBackup} 
                className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors rounded hover:bg-white/5"
                title="Importar Backup JSON"
              >
                <HardDriveUpload className="w-4 h-4" />
              </button>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={onImportBackupChange} 
              />
            </div>
            
            <div className="flex bg-black/40 rounded-lg p-1 border border-red-900/30">
              <button 
                onClick={() => setViewMode('WAR_ROOM')} 
                className={`px-4 py-2 rounded text-sm font-medium transition-all ${viewMode === 'WAR_ROOM' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Sala de guerra
              </button>
              <button 
                onClick={() => setViewMode('EXECUTIVE')} 
                className={`px-4 py-2 rounded text-sm font-medium transition-all ${viewMode === 'EXECUTIVE' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Ejecutivo
              </button>
            </div>
            
            <button 
              onClick={handleDownloadPdf} 
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" /> Exportar PDF
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* 🔥 FIX: Mostrar errores del worker si existen */}
        {graphErrors && graphErrors.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
            <h3 className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Advertencias de Cálculo
            </h3>
            <ul className="text-sm text-yellow-200 space-y-1">
              {graphErrors.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
            <p className="text-xs text-yellow-300 mt-2">
              Los nodos se muestran sin cálculo de riesgo sistémico. El worker puede estar inactivo.
            </p>
          </div>
        )}

        {/* 🔥 FIX: Usar processedNodes si existe, sino rawNodes */}
        {(processedNodes.length === 0 && rawNodes.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShieldAlert className="w-16 h-16 text-gray-700 mb-4" />
            <h3 className="text-xl font-bold text-gray-500 mb-2">No hay datos cargados</h3>
            <p className="text-gray-600 max-w-md">
              Importa un archivo CSV para comenzar a analizar la topología de riesgo o carga un backup JSON existente.
            </p>
          </div>
        ) : viewMode === 'WAR_ROOM' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* 🔥 FIX: Mostrar processedNodes o rawNodes fallback */}
            {(processedNodes.length > 0 ? processedNodes : rawNodes).map((node: any) => (
              <NodeCard 
                key={node.id} 
                id={node.id}
                onClick={() => setSelectedNode(node.id)}
              />
            ))}
          </div>
        ) : (
          <ExecutiveSummary />
        )}
      </main>

      {isImporterOpen && <DataImporter onClose={() => setIsImporterOpen(false)} />}
      {isSimulatorOpen && <SimulatorPanel onClose={() => setIsSimulatorOpen(false)} />}
      {selectedNodeId && (
        <NodeDetailDrawer 
          nodeId={selectedNodeId}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

export default App;