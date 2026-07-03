import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, Animated, Dimensions
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { runFullTest } from '../../../shared/speedTest.js'
import { findServerById } from '../../../shared/servers.js'
import { getRecommendations } from '../../../shared/recommendations.js'

const API_BASE = 'http://10.0.2.2:3001/api'
const { width } = Dimensions.get('window')

export default function HomeScreen({ navigation }) {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState(null)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('')
  const [networkInfo, setNetworkInfo] = useState(null)
  const [planSpeed, setPlanSpeed] = useState(0)
  const spinAnim = useState(new Animated.Value(0))[0]

  useEffect(() => {
    fetch(API_BASE + '/isp-lookup')
      .then(r => r.json())
      .then(data => setNetworkInfo(prev => ({ ...prev, ...data })))
      .catch(() => {})
    AsyncStorage.getItem('tw_plan').then(v => setPlanSpeed(parseInt(v) || 0))
  }, [])

  useEffect(() => {
    if (testing) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start()
    } else {
      spinAnim.setValue(0)
    }
  }, [testing])

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const loadHistory = async () => {
    try {
      return JSON.parse(await AsyncStorage.getItem('tw_history') || '[]')
    } catch { return [] }
  }

  const saveHistory = async (data) => {
    const history = await loadHistory()
    history.unshift({ ...data, id: Date.now(), date: new Date().toISOString() })
    await AsyncStorage.setItem('tw_history', JSON.stringify(history.slice(0, 100)))
  }

  const handleStart = useCallback(async () => {
    setTesting(true)
    setResults(null)
    setProgress(0)
    setPhase('Starting...')

    const serverUrl = API_BASE

    try {
      const fullResults = await runFullTest(serverUrl, {
        planSpeed,
        onProgress: (p) => {
          setPhase(p.phase.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))
          setProgress(p.percent)
        },
      })

      setResults(fullResults)
      await saveHistory(fullResults)
    } catch (err) {
      Alert.alert('Test Failed', 'Please check your connection and try again.')
    } finally {
      setTesting(false)
      setPhase('')
    }
  }, [planSpeed])

  const recs = results ? getRecommendations(results.download?.average || 0) : null

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.gaugeContainer}>
        <Animated.View style={[styles.gaugeOuter, { transform: [{ rotate: spin }] }]}>
          <View style={styles.gaugeInner}>
            <Text style={styles.gaugeValue}>
              {testing ? '...' : (results?.download?.average || 0).toFixed(1)}
            </Text>
            <Text style={styles.gaugeUnit}>{results?.download?.unit || 'Mbps'}</Text>
            <Text style={styles.gaugeLabel}>Download</Text>
          </View>
        </Animated.View>
      </View>

      {testing && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{phase} — {Math.round(progress)}%</Text>
        </View>
      )}

      {!testing && !results && (
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>Start Test</Text>
        </TouchableOpacity>
      )}

      {results && (
        <View style={styles.resultsSection}>
          <View style={styles.resultsGrid}>
            <ResultBox icon="📥" label="Download" value={results.download.average.toFixed(1)} unit={results.download.unit} color="#0055A5" />
            <ResultBox icon="📤" label="Upload" value={results.upload.average.toFixed(1)} unit={results.upload.unit} color="#22c55e" />
            <ResultBox icon="📡" label="Ping" value={results.ping.average.toFixed(0)} unit={results.ping.unit} color="#f97316" />
            <ResultBox icon="⚡" label="Jitter" value={results.jitter.average.toFixed(1)} unit={results.jitter.unit} color="#a855f7" />
          </View>

          {recs && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>At this speed you can:</Text>
              <View style={styles.recBar}>
                <View style={[styles.recFill, { backgroundColor: recs.activity.color, width: '80%' }]} />
              </View>
              <Text style={styles.recLabel}>{recs.activity.label}</Text>
              <View style={styles.gameTags}>
                {recs.games.games.map((g, i) => (
                  <View key={i} style={styles.gameTag}>
                    <Text style={styles.gameTagText}>{g}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Network Info</Text>
            <InfoRow label="Provider" value={networkInfo?.isp || 'Unknown'} />
            <InfoRow label="IP Address" value={networkInfo?.ip || '...'} />
          </View>

          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>Test Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}

function ResultBox({ icon, label, value, unit, color }) {
  return (
    <View style={[styles.resultBox, { borderLeftColor: color }]}>
      <Text style={styles.resultIcon}>{icon}</Text>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={[styles.resultValue, { color }]}>{value} <Text style={styles.resultUnit}>{unit}</Text></Text>
    </View>
  )
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  gaugeContainer: { alignItems: 'center', marginVertical: 24 },
  gaugeOuter: {
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 8, borderColor: '#0055A5',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  gaugeInner: { alignItems: 'center' },
  gaugeValue: { fontSize: 48, fontWeight: '800', color: '#ffffff' },
  gaugeUnit: { fontSize: 16, color: '#94a3b8' },
  gaugeLabel: { fontSize: 14, color: '#64748b', marginTop: 4 },
  progressSection: { alignItems: 'center', marginBottom: 24 },
  progressBar: {
    width: width - 64, height: 6, backgroundColor: '#1e293b',
    borderRadius: 3, overflow: 'hidden', marginBottom: 8,
  },
  progressFill: { height: 6, backgroundColor: '#0055A5', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#64748b' },
  startButton: {
    backgroundColor: '#0055A5', paddingVertical: 16, paddingHorizontal: 48,
    borderRadius: 16, alignItems: 'center', marginVertical: 16,
    shadowColor: '#0055A5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  startButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  resultsSection: { gap: 12 },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  resultBox: {
    width: (width - 48) / 2, backgroundColor: '#1e293b',
    borderRadius: 12, padding: 16, borderLeftWidth: 3,
  },
  resultIcon: { fontSize: 24, marginBottom: 4 },
  resultLabel: { fontSize: 12, color: '#94a3b8' },
  resultValue: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  resultUnit: { fontSize: 12, fontWeight: '400', color: '#64748b' },
  card: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  recBar: { height: 6, backgroundColor: '#334155', borderRadius: 3, marginBottom: 8 },
  recFill: { height: 6, borderRadius: 3 },
  recLabel: { fontSize: 14, color: '#e2e8f0', marginBottom: 8 },
  gameTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gameTag: { backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  gameTagText: { fontSize: 11, color: '#cbd5e1' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#334155' },
  infoLabel: { fontSize: 13, color: '#94a3b8' },
  infoValue: { fontSize: 13, color: '#e2e8f0' },
})
