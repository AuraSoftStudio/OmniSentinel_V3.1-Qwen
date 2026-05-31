// src/components/executive/LossRadarReport.tsx
import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { useOmnisentinelStore } from '../../hooks/useOmnisentinelStore';

const styles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#f5f5f5' }, // Fondo claro para mejor compatibilidad
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center', color: '#1a1a1a' },
  subtitle: { fontSize: 12, marginBottom: 30, textAlign: 'center', color: '#666' },
  section: { marginBottom: 20 },
  header: { fontSize: 16, marginBottom: 10, borderBottom: '1px solid #ccc', paddingBottom: 5, color: '#333' },
  item: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 },
  itemName: { width: '60%', color: '#444' },
  itemValue: { width: '40%', textAlign: 'right', fontWeight: 'bold', color: '#000' },
  total: { marginTop: 20, paddingTop: 10, borderTop: '2px solid #333', flexDirection: 'row', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 14 },
  disclaimer: { marginTop: 30, fontSize: 10, color: '#999', textAlign: 'center' }
});

export const LossRadarReport = () => {
  const { calculatedNodes } = useOmnisentinelStore();
  const nodesArray = Object.values(calculatedNodes);
  const totalExposedLoss = nodesArray.reduce((sum, n) => sum + n.exposedLoss, 0);
  const topLeaks = [...nodesArray].sort((a, b) => b.exposedLoss - a.exposedLoss).slice(0, 3);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>OMNISENTINEL LOSS RADAR REPORT</Text>
        <Text style={styles.subtitle}>Fecha: {new Date().toLocaleDateString('es-MX')}</Text>

        <View style={styles.section}>
          <Text style={styles.header}>Top 3 Fugas Financieras</Text>
          {topLeaks.map((node, i) => (
            <View key={node.id} style={styles.item}>
              <Text style={styles.itemName}>{i + 1}. {node.name}</Text>
              <Text style={styles.itemValue}>${node.exposedLoss.toLocaleString()} USD/día</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.header}>Resumen Ejecutivo</Text>
          <View style={styles.item}>
            <Text style={styles.itemName}>Total en riesgo diario</Text>
            <Text style={styles.itemValue}>${totalExposedLoss.toLocaleString()} USD</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.itemName}>Potencial de mitigación estimado</Text>
            <Text style={styles.itemValue}>↑ ${(totalExposedLoss * 0.7).toLocaleString()} USD/día</Text>
          </View>
        </View>

        <View style={styles.total}>
          <Text>ROI Estimado de corrección:</Text>
          <Text>${Math.round(totalExposedLoss * 0.7 * 30).toLocaleString()} USD/mes</Text>
        </View>

        <Text style={styles.disclaimer}>
          *Reporte generado por Omnisentinel V3.1 — Simulación basada en topología actual.
        </Text>
      </Page>
    </Document>
  );
};