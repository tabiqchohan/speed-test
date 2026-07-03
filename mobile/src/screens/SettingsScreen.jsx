import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Alert
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SPEED_TIPS } from '../../../shared/constants.js'

export default function SettingsScreen() {
  const [planSpeed, setPlanSpeed] = useState('')
  const [testSize, setTestSize] = useState('medium')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    AsyncStorage.multiGet(['tw_plan', 'tw_testSize']).then(([plan, size]) => {
      setPlanSpeed(plan[1] || '')
      setTestSize(size[1] || 'medium')
    })
  }, [])

  const handleSave = async () => {
    await AsyncStorage.multiSet([
      ['tw_plan', planSpeed],
      ['tw_testSize', testSize],
    ])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const exportData = async () => {
    try {
      const history = JSON.parse(await AsyncStorage.getItem('tw_history') || '[]')
      if (history.length === 0) {
        Alert.alert('No Data', 'No test history to export.')
        return
      }
      const text = history.map((h, i) =>
        `#${i + 1}: ${new Date(h.date).toLocaleDateString()} - Down: ${(h.download?.average || 0).toFixed(1)} Mbps`
      ).join('\n')
      Alert.alert('Data', text.slice(0, 2000))
    } catch {}
  }

  const sizes = [
    { key: 'small', label: 'Small (10MB)' },
    { key: 'medium', label: 'Medium (50MB)' },
    { key: 'large', label: 'Large (100MB)' },
  ]

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test File Size</Text>
        <View style={styles.sizeRow}>
          {sizes.map(s => (
            <TouchableOpacity
              key={s.key}
              style={[styles.sizeBtn, testSize === s.key && styles.sizeBtnActive]}
              onPress={() => setTestSize(s.key)}
            >
              <Text style={[styles.sizeBtnText, testSize === s.key && styles.sizeBtnTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Plan Speed (Mbps)</Text>
        <TextInput
          style={styles.input}
          value={planSpeed}
          onChangeText={setPlanSpeed}
          keyboardType="numeric"
          placeholder="e.g. 50"
          placeholderTextColor="#64748b"
        />
        <Text style={styles.hint}>Used for throttling detection</Text>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{saved ? '✓ Saved!' : 'Save Settings'}</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Speed Improvement Tips</Text>
        {SPEED_TIPS.slice(0, 5).map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export Data</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={exportData}>
          <Text style={styles.exportBtnText}>Export History</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  section: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  sizeRow: { flexDirection: 'row', gap: 8 },
  sizeBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#0f172a', alignItems: 'center' },
  sizeBtnActive: { backgroundColor: '#0055A5' },
  sizeBtnText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  sizeBtnTextActive: { color: '#ffffff' },
  input: { backgroundColor: '#0f172a', borderRadius: 10, padding: 14, fontSize: 16, color: '#e2e8f0', borderWidth: 1, borderColor: '#334155' },
  hint: { fontSize: 11, color: '#64748b', marginTop: 6 },
  saveBtn: { backgroundColor: '#0055A5', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  tipRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tipBullet: { color: '#0055A5', fontSize: 14 },
  tipText: { fontSize: 13, color: '#cbd5e1', flex: 1 },
  exportBtn: { backgroundColor: '#334155', padding: 14, borderRadius: 12, alignItems: 'center' },
  exportBtnText: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
})
