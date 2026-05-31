// src/App.tsx
import { useEffect, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { ShieldAlert, LayoutDashboard, BarChart3, RefreshCw, FileDown } from 'lucide-react';
import { useOmnisentinelStore } from './hooks/useOmnisentinelStore';
import { NodeCard } from './components/ui/NodeCard';
import { LossRadarReport } from './components/executive/LossRadarReport';
import { ExecutiveSummary } from './components/executive/ExecutiveSummary';

function App() {
  const { 
    calculatedNodes, 
    loadTemplate, 
    loadFromSheets, 
    isLoading, 
    viewMode, 
    setViewMode,
    dataSource 
  } = useOmnisentinelStore();

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Cargar datos al iniciar
  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  // Función robusta para generar y descargar el PDF
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      // Generamos el documento como un Blob
      const doc = <LossRadarReport />;
      const asBlob = await pdf(doc).toBlob();
      
      // Usamos file-saver para descargarlo
      saveAs(asBlob, 'Omnisentinel_Loss_Radar_Report.pdf');
    } catch (error) {
      console.error(" Error generando PDF:", error);
      alert("Hubo un error al generar el reporte. Revisa la consola.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleReload = () => {
    if (dataSource === 'SHEETS') {
      loadFromSheets();
    } else {
      loadTemplate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-warroom-bg">
        <div className="text-warroom-accent text-xl animate-pulse flex items-center gap-2">
          <ShieldAlert className="w-6 h-6" /> Inicializando Motor V-CORE...
        </div>
      </div>
    );
  }

  const nodesArray = Object.values(calculatedNodes);

  return (
    <div className="p-6 md:p-8 min-h-screen bg-warroom-bg text-gray-200 font-sans">
      {/* Header Profesional */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-warroom-accent/10 p-2 rounded-lg border border-warroom-accent/30">
            <ShieldAlert className="w-8 h-8 text-warroom-accent" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Omnisentinel <span className="text-warroom-accent">V3.1</span>
            </h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Risk Topology Engine</p>
          </div>
        </div>

        {/* Controles Superiores */}
        <div className="flex items-center gap-4 w-full lg:w-auto flex-wrap">
          
          {/* Botón de Recarga de Datos */}
          <button
            onClick={handleReload}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors border border-gray-700"
          >
            <RefreshCw className="w-4 h-4" /> 
            <span className="hidden sm:inline">Recargar ({dataSource})</span>
          </button>

          {/* Toggle de Vista */}
          <div className="flex bg-black/40 rounded-lg p-1 border border-white/10 backdrop-blur-sm">
            <button
              onClick={() => setViewMode('WAR_ROOM')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'WAR_ROOM' 
                  ? 'bg-warroom-panel text-warroom-accent shadow-lg' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> War Room
            </button>
            <button
              onClick={() => setViewMode('EXECUTIVE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'EXECUTIVE' 
                  ? 'bg-blue-600/20 text-blue-400 shadow-lg border border-blue-500/30' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Executive
            </button>
          </div>

          {/* Botón PDF Manual (Más robusto) */}
          <button 
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 bg-warroom-accent hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-2 px-4 rounded-lg transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)] whitespace-nowrap"
          >
            {isGeneratingPdf ? (
              <>⏳ Generando...</>
            ) : (
              <><FileDown className="w-4 h-4" /> Exportar PDF</>
            )}
          </button>
        </div>
      </header>

      {/* Contenido Dinámico */}
      {viewMode === 'WAR_ROOM' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {nodesArray.map((node) => (
            <NodeCard key={node.id} id={node.id} />
          ))}
        </div>
      ) : (
        <ExecutiveSummary />
      )}
    </div>
  );
}

export default App;