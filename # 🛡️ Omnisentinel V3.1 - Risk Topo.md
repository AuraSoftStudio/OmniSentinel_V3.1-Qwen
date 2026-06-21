# 🛡️ Omnisentinel V3.3
## Motor Táctico Predictivo de Colapso Operacional

<p align="center">
  <strong>Visualiza riesgos. Simula escenarios. Previene colapsos.</strong>
</p>

---

## 📋 Descripción

**Omnisentinel** es una aplicación web local-first diseñada para analistas de riesgos, COOs y directivos que necesitan entender cómo las fugas operativas se propagan a través de la topología de una organización.

A diferencia de un dashboard tradicional, Omnisentinel:
- **Calcula el riesgo sistémico** (no solo el riesgo individual de cada nodo).
- **Modela el contagio topológico** entre dependencias operativas.
- **Simula escenarios** con variables financieras y operativas en tiempo real.
- **Aísla nodos críticos** mediante Kill Switch para contener pérdidas.
- **Exporta reportes ejecutivos** en PDF para toma de decisiones.

---

## 🚀 Características Principales

### 🎯 War Room Console
- Vista táctica oscura con tarjetas de nodos en tiempo real.
- Indicadores visuales de riesgo (verde/amarillo/rojo).
- Pérdida diaria expuesta calculada dinámicamente.
- Botón **Kill Switch** para aislar nodos críticos.

### 📊 Executive Summary
- KPIs financieros agregados (Pérdida Diaria, Capital Protegido, ROI).
- Top 5 fugas financieras priorizadas.
- Proyección de ahorro mensual por mitigación.

### 🧪 Simulador What-If (Determinista)
- 5 variables tácticas ajustables en tiempo real:
  - Inflación Operativa (0-50%)
  - Capacidad Operativa (20-100%)
  - Tiempo de Respuesta (0-72h)
  - Tasa de Fallo Crítico (0-40%)
  - Severidad de Penalizaciones (x1-x10)
- Panel de impacto inmediato con deltas en tiempo real.
- Alertas predictivas automáticas.

### 📥 Importador Universal de Datos
- Carga de archivos CSV con **Smart Mapping** automático.
- Sanitización numérica robusta (`$5,000` → `5000`).
- Validación topológica antes de importar.
- Preview de datos con warnings y errores.

### 🔍 Node Detail Drawer
- Panel lateral con diagnóstico completo por nodo.
- Mapa de dependencias (padres e hijos).
- Planes de acción tácticos basados en triggers.
- Análisis de riesgo base vs. riesgo sistémico.

### 📄 Exportación PDF
- Reporte Loss Radar con resumen ejecutivo.
- Top 3 fugas prioritarias.
- Proyección de ahorro por mitigación.

### 💾 Persistencia y Backup
- **IndexedDB** para persistencia robusta entre sesiones.
- **Backup JSON** exportable/importable manualmente.
- Los datos nunca salen del navegador (100% Local-First).

### ⚡ Arquitectura Asíncrona (Web Workers)
- Motor V-CORE ejecutado en **Web Worker** dedicado.
- UI 100% fluida durante cálculos intensivos.
- Indicador visual "Calculando Topología..." durante procesamiento.
- Aislamiento de lógica matemática del hilo principal de React.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Framework** | React + TypeScript | 18.x |
| **Build System** | Vite (Rolldown) | 8.x |
| **Estado Global** | Zustand + persist | 4.x |
| **Persistencia** | IndexedDB (idb-keyval) | 3.x |
| **Concurrencia** | Web Workers + Comlink | 4.x |
| **Estilos** | Tailwind CSS | 3.x |
| **Validación** | Zod | 3.x |
| **CSV Parsing** | PapaParse | 5.x |
| **PDF Export** | @react-pdf/renderer | 3.x |
| **Iconos** | lucide-react | latest |
| **Drag & Drop** | react-dropzone | latest |

---

## 📁 Estructura del Proyecto
OMNISENTINEL V3.3/
├── public/
│ └── logo.png
├── src/
│ ├── assets/
│ ├── components/
│ │ ├── executive/
│ │ │ ├── ExecutiveSummary.tsx
│ │ │ └── LossRadarReport.tsx
│ │ ├── ui/
│ │ │ └── NodeCard.tsx
│ │ ├── DataImporter.tsx
│ │ ├── NodeDetailDrawer.tsx
│ │ └── SimulatorPanel.tsx
│ ├── config/
│ │ ├── actionPlans.js
│ │ ├── actionPlans.d.ts
│ │ └── triggerHelpers.js
│ ├── core/
│ │ ├── topology/
│ │ │ └── topologyValidator.ts
│ │ └── vcore/
│ │ └── engine.ts
│ │ └── vcore.worker.ts ← Motor en Web Worker
│ ├── hooks/
│ │ └── useOmnisentinelStore.ts ← Store Zustand + IndexedDB
│ ├── services/
│ │ ├── dataParser.ts
│ │ ├── sheetsLoader.ts
│ │ ├── storage.ts ← Adaptador IndexedDB
│ │ └── vcoreService.ts ← Puente Comlink
│ ├── types/
│ │ └── omnisentinel.ts
│ ├── App.tsx
│ ├── main.tsx
│ └── index.css
├── vite.config.ts
├── tsconfig.json
└── package.json


---

## ⚙️ Instalación

### Requisitos
- Node.js 18+ 
- npm 9+

### Pasos
```bash
# 1. Clonar o descargar el proyecto
git clone https://github.com/TU_USUARIO/omnisentinel-v3.git
cd omnisentinel-v3

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir en navegador
# http://localhost:5173

Comandos Disponibles
npm run dev      # Servidor de desarrollo con HMR
npm run build    # Build de producción (TypeScript + Vite)
npm run preview  # Previsualizar build de producción
npm run lint     # Linting con ESLint

Arquitectura Técnica
Flujo de Datos

CSV → DataImporter → dataParser.ts → ProjectNode[]
                                          ↓
                                    useOmnisentinelStore (Zustand)
                                          ↓
                                    vcoreService.ts (Comlink)
                                          ↓
                                    vcore.worker.ts (Web Worker)
                                          ↓
                                    processGraph() → ProcessedNode[]
                                          ↓
                                    IndexedDB (persist) + UI React

Motor V-CORE
El motor calcula el riesgo sistémico de cada nodo considerando:
Riesgo base inherente del nodo.
Contagio topológico desde nodos padre (peso 30%).
Factores adicionales: saturación de flota, bloqueos críticos, riesgo externo.
Kill Switch: aislamiento total (riesgo = 0, sin contagio).
Fórmula base:
systemicRisk = riskBase 
             + Σ(parentRisk × 0.3) 
             + saturacionFlota × 20 
             + bloqueosCriticos × 15 
             + riesgoExterno × 10

exposedLoss = daily_operation_cost × (systemicRisk / 100)

Concurrencia
Main Thread: React UI, eventos de usuario, renderizado.
Worker Thread: Cálculos matemáticos del V-CORE.
Comunicación: Comlink (RPC asíncrono sobre MessageChannel).
🗺️ Roadmap
✅ Sprint 1: Infraestructura y Concurrencia (COMPLETADO)
Migración de localStorage a IndexedDB
Backup/Restore JSON manual
Migración del motor V-CORE a Web Workers
Integración con Comlink
Indicador visual de carga asíncrona
Fix del Kill Switch (aislamiento real de contagio)
🔄 Sprint 2: Motor Monte Carlo (PRÓXIMO)
Simulación estocástica con 10,000 iteraciones
Rangos de incertidumbre en variables del simulador
Distribuciones Normal y Uniforme
Visualización de percentiles (P50, P90, P99)
Gráficos de distribución de probabilidad
Worker dedicado para Monte Carlo
Code splitting para carga lazy del motor
📌 Sprint 3: Integraciones y Colaboración (FUTURO)
Integración con Jira (crear tickets desde nodos)
Conector Google Sheets (resuelto CORS en Vercel)
Multi-usuario y proyectos compartidos
Historial de escenarios y comparativas
API REST para integración con ERP/CRM
🔒 Privacidad y Seguridad
Omnisentinel es 100% Local-First:
Todos los datos se procesan en el navegador del usuario.
No se envía información a servidores externos.
La persistencia usa IndexedDB (almacenamiento local del navegador).
Los backups JSON pueden cifrarse antes de compartirse.
📄 Licencia
MIT License. Ver LICENSE para más detalles.
👤 Autor
Desarrollado como MVP para validación de producto en el ámbito de gestión de riesgos operacionales y continuidad del negocio.
<div align="center">
<strong>🛡️ Omnisentinel — Anticipa el colapso. Protege la operación.</strong>
</div>
```
