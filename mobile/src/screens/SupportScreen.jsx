import React, { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Alert, ActivityIndicator
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function SupportScreen() {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', connectionType: '', issue: '', planSpeed: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.issue) {
      Alert.alert('Required', 'Name, phone, and issue are required.')
      return
    }

    setSubmitting(true)

    let latestResult = null
    try {
      const history = JSON.parse(await AsyncStorage.getItem('tw_history') || '[]')
      latestResult = history[0] || null
    } catch {}

    const payload = {
      ...form,
      planSpeed: parseFloat(form.planSpeed) || 0,
      testResult: latestResult,
    }

    try {
      const response = await fetch('http://10.0.2.2:3001/api/complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        Alert.alert('Error', 'Submission failed. Please try again.')
      }
    } catch {
      Alert.alert('Network Error', 'Please check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Complaint Submitted!</Text>
        <Text style={styles.successText}>Our team will contact you soon.</Text>
        <TouchableOpacity style={styles.submitBtn} onPress={() => setSubmitted(false)}>
          <Text style={styles.submitBtnText}>Submit Another</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Submit a Complaint</Text>
        <Text style={styles.cardSubtitle}>Having speed issues? Let us know.</Text>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput style={styles.input} value={form.name} onChangeText={v => updateField('name', v)} placeholder="Muhammad Ali" placeholderTextColor="#64748b" />

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput style={styles.input} value={form.phone} onChangeText={v => updateField('phone', v)} keyboardType="phone-pad" placeholder="03XX-XXXXXXX" placeholderTextColor="#64748b" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={form.email} onChangeText={v => updateField('email', v)} keyboardType="email-address" placeholder="email@example.com" placeholderTextColor="#64748b" />

        <Text style={styles.label}>Connection Type</Text>
        <View style={styles.typeRow}>
          {['Fiber', 'DSL', '4G', '5G', 'WiFi'].map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.typeBtn, form.connectionType === type && styles.typeBtnActive]}
              onPress={() => updateField('connectionType', type)}
            >
              <Text style={[styles.typeBtnText, form.connectionType === type && styles.typeBtnTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Plan Speed (Mbps)</Text>
        <TextInput style={styles.input} value={form.planSpeed} onChangeText={v => updateField('planSpeed', v)} keyboardType="numeric" placeholder="50" placeholderTextColor="#64748b" />

        <Text style={styles.label}>Issue Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.issue}
          onChangeText={v => updateField('issue', v)}
          multiline
          numberOfLines={4}
          placeholder="Describe your issue..."
          placeholderTextColor="#64748b"
        />

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Complaint</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#e2e8f0', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0f172a', borderRadius: 10, padding: 14, fontSize: 15, color: '#e2e8f0', borderWidth: 1, borderColor: '#334155' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: 6 },
  typeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
  typeBtnActive: { backgroundColor: '#0055A5', borderColor: '#0055A5' },
  typeBtnText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  typeBtnTextActive: { color: '#ffffff' },
  submitBtn: { backgroundColor: '#0055A5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 20, fontWeight: '700', color: '#e2e8f0', marginBottom: 8 },
  successText: { fontSize: 14, color: '#64748b', marginBottom: 24, textAlign: 'center' },
})
