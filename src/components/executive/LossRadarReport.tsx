// src/components/executive/LossRadarReport.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { useOmnisentinelStore } from '../../hooks/useOmnisentinelStore';

const styles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#0a0a0a' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  subtitle: { fontSize: 12, color: '#999', marginBottom: 30 },
  section: { marginBottom: 20, padding: 15, borderWidth: 1, borderColor: '#333', borderRadius: 4 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#ef4444', marginBottom: 10 },
  item: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { fontSize: 10, color: '#fff' },
  itemValue: { fontSize: 10, color: '#ef4444', fontWeight: 'bold' },
  kpi: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  kpiLabel: { fontSize: 10, color: '#999' },
  kpiValue: { fontSize: 16, fontWeight: 'bold', color: '#ef4444' },
});

export const LossRadarReport = () => {
  const { processedNodes } = useOmnisentinelStore();
  
  // 🔥 CAMBIO: Usar exposedLoss
  const totalExposedLoss = processedNodes.reduce(
    (sum: number, n: any) => sum + (n.exposedLoss || 0), 
    0
  );
  
  const topLeaks = [...processedNodes]
    .sort((a: any, b: any) => (b.exposedLoss || 0) - (a.exposedLoss || 0))
    .slice(0, 3);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Omnisentinel - Loss Radar Report</Text>
        <Text style={styles.subtitle}>
          Generado el {new Date().toLocaleDateString('es-CL')} - Motor V-CORE V3.2
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen Ejecutivo</Text>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Pérdida Diaria Total Expuesta</Text>
            <Text style={styles.kpiValue}>${Math.round(totalExposedLoss).toLocaleString()} USD</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Pérdida Anual Proyectada</Text>
            <Text style={styles.kpiValue}>${Math.round(totalExposedLoss * 365).toLocaleString()} USD</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Ahorro Potencial por Mitigación (70%)</Text>
            <Text style={styles.kpiValue}>↑ ${Math.round(totalExposedLoss * 0.7 * 30).toLocaleString()} USD/mes</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 3 Fugas Prioritarias</Text>
          {topLeaks.map((node: any, i: number) => (
            <View key={node.id} style={styles.item}>
              <Text style={styles.itemName}>{i + 1}. {node.name}</Text>
              <Text style={styles.itemValue}>${Math.round(node.exposedLoss || 0).toLocaleString()} USD/día</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análisis Topológico</Text>
          <Text style={{ fontSize: 10, color: '#ccc' }}>
            Total de nodos analizados: {processedNodes.length}
          </Text>
          <Text style={{ fontSize: 10, color: '#ccc' }}>
            Nodos críticos (riesgo &gt; 60%): {processedNodes.filter((n: any) => n.riskBase > 60).length}
          </Text>
          <Text style={{ fontSize: 10, color: '#ccc' }}>
            Nodos aislados (Kill Switch): {processedNodes.filter((n: any) => n.isKilled).length}
          </Text>
        </View>
      </Page>
    </Document>
  );
};