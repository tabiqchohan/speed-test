import React, { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, Alert
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LineChart } from 'react-native-chart-kit'
import { useFocusEffect } from '@react-navigation/native'

const { width } = Dimensions.get('window')

export default function HistoryScreen() {
  const [history, setHistory] = useState([])

  useFocusEffect(
    useCallback(() => {
      loadHistory()
    }, [])
  )

  const loadHistory = async () => {
    try {
      const data = JSON.parse(await AsyncStorage.getItem('tw_history') || '[]')
      setHistory(data)
    } catch {
      setHistory([])
    }
  }

  const clearHistory = () => {
    Alert.alert('Clear History', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('tw_history')
          setHistory([])
        },
      },
    ])
  }

  if (history.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>Test History</Text>
        <Text style={styles.emptyText}>No tests yet. Run your first speed test!</Text>
      </View>
    )
  }

  const chartData = {
    labels: history.slice(0, 7).reverse().map((_, i) => `#${history.length - i}`).reverse(),
    datasets: [
      {
        data: history.slice(0, 7).map(h => h.download?.average || 0).reverse(),
        color: () => '#0055A5',
        strokeWidth: 2,
      },
    ],
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Test History ({history.length})</Text>
        <TouchableOpacity onPress={clearHistory}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {history.length > 1 && (
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={width - 48}
            height={200}
            chartConfig={{
              backgroundGradientFrom: '#1e293b',
              backgroundGradientTo: '#1e293b',
              decimalCount: 0,
              color: () => '#0055A5',
              labelColor: () => '#64748b',
              propsForBackgroundLines: { stroke: '#334155' },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {history.map(h => (
        <View key={h.id} style={styles.historyItem}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyDate}>
              {new Date(h.date).toLocaleDateString()}
            </Text>
            <Text style={styles.historyTime}>
              {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.historyStats}>
            <Stat text="Down" value={`${(h.download?.average || 0).toFixed(1)}`} color="#0055A5" />
            <Stat text="Up" value={`${(h.upload?.average || 0).toFixed(1)}`} color="#22c55e" />
            <Stat text="Ping" value={`${(h.ping?.average || 0).toFixed(0)}`} color="#f97316" />
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

function Stat({ text, value, color }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{text}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#e2e8f0' },
  clearText: { fontSize: 14, color: '#ef4444', fontWeight: '600' },
  chartContainer: { marginBottom: 16 },
  chart: { borderRadius: 12 },
  historyItem: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 16,
    marginBottom: 8, borderWidth: 1, borderColor: '#334155',
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  historyDate: { fontSize: 14, fontWeight: '600', color: '#e2e8f0' },
  historyTime: { fontSize: 12, color: '#64748b' },
  historyStats: { flexDirection: 'row', gap: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#64748b', marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: '700' },
})
