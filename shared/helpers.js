export function formatSpeed(kbps) {
  if (kbps >= 1000000) {
    return { value: (kbps / 1000000).toFixed(2), unit: 'Gbps', kbps: Math.round(kbps) }
  }
  if (kbps >= 1000) {
    return { value: (kbps / 1000).toFixed(1), unit: 'Mbps', kbps: Math.round(kbps) }
  }
  return { value: Math.round(kbps), unit: 'Kbps', kbps: Math.round(kbps) }
}

export function formatLatency(ms) {
  if (ms < 1) return { value: (ms * 1000).toFixed(0), unit: 'μs' }
  return { value: ms.toFixed(0), unit: 'ms' }
}

export function formatBytes(bytes) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB'
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return bytes + ' B'
}

export function average(values) {
  if (!values || values.length === 0) return 0
  const sum = values.reduce((a, b) => a + b, 0)
  return sum / values.length
}

export function median(values) {
  if (!values || values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function jitter(values) {
  if (!values || values.length < 2) return 0
  const diffs = []
  for (let i = 1; i < values.length; i++) {
    diffs.push(Math.abs(values[i] - values[i - 1]))
  }
  return average(diffs)
}

export function packetLoss(sent, received) {
  if (sent === 0) return 0
  return ((sent - received) / sent) * 100
}

export function removeOutliers(values) {
  if (!values || values.length < 4) return values
  const sorted = [...values].sort((a, b) => a - b)
  sorted.shift()
  sorted.pop()
  return sorted
}

export function stabilityScore(samples) {
  if (!samples || samples.length < 2) return 100
  const avg = average(samples)
  if (avg === 0) return 0
  const maxDev = Math.max(...samples.map(s => Math.abs(s - avg)))
  const score = Math.max(0, 100 - (maxDev / avg) * 50)
  return Math.round(score)
}

export function calculateMbps(bytes, timeMs) {
  if (timeMs <= 0) return 0
  const bits = bytes * 8
  const seconds = timeMs / 1000
  return (bits / seconds) / 1000000
}

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function calcNetworkQuality({ download, upload, ping, jitter, packetLoss, stability }) {
  let score = 0
  score += Math.min(download / 100, 1) * 30
  score += Math.min(upload / 50, 1) * 15
  score += Math.max(0, Math.min(100, 100 - ping)) * 0.25
  score += Math.max(0, Math.min(100, 100 - jitter * 10)) * 0.10
  score += (packetLoss === 0 ? 100 : Math.max(0, 100 - packetLoss * 20)) * 0.10
  score += (stability || 0) * 0.10
  const rounded = Math.round(score)
  const label = rounded >= 90 ? 'Outstanding' : rounded >= 75 ? 'Excellent' : rounded >= 50 ? 'Good' : rounded >= 25 ? 'Fair' : 'Poor'
  const color = rounded >= 90 ? '#a78bfa' : rounded >= 75 ? '#34d399' : rounded >= 50 ? '#60a5fa' : rounded >= 25 ? '#fbbf24' : '#f87171'
  return { score: rounded, label, color }
}

export function calcConsistency(samples) {
  if (!samples || samples.length < 3) return null
  const vals = samples.filter(s => s != null && s > 0)
  if (vals.length < 3) return null
  const mean = average(vals)
  if (mean === 0) return 0
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length
  const cv = Math.sqrt(variance) / mean
  return Math.round(Math.max(0, Math.min(100, (1 - cv) * 100)))
}

export function isPeakHour() {
  const h = new Date().getHours()
  return h >= 19 || h < 23
}

export function isPeakHourPK() {
  const h = new Date().getHours()
  return h >= 19 && h <= 23
}

export function getWiFiAdvice(connectionType, speed, consistency) {
  if (connectionType?.id !== 'wifi') return null
  const issues = []
  if (speed < 10) issues.push('Router ko open space mein rakhain, walls aur obstacles se door')
  if (speed < 20 && speed >= 10) issues.push('5GHz WiFi band use karein agar router support karta hai')
  if (consistency != null && consistency < 50) issues.push('WiFi interference ho sakta hai — router channel change karein')
  if (issues.length === 0) return { type: 'good', msg: 'WiFi connection healthy hai', color: '#34d399', icon: '📡' }
  return { type: 'warn', msg: issues[0], color: '#fbbf24', icon: '⚠️' }
}

export function getEthernetAdvice(connectionType, speed) {
  if (connectionType?.id === 'wifi' && speed < 20) {
    return { msg: 'Ethernet cable use karein for faster & stable connection', color: '#fb923c', icon: '🔌' }
  }
  return null
}

export function getComparativePercentile(ispData, userSpeed) {
  if (!ispData || !ispData.avgDownload) return null
  const ratio = userSpeed / ispData.avgDownload
  const pct = Math.round(Math.min(99, Math.max(1, ratio * 50 + 50)))
  return pct
}

export function generateResultCard(results) {
  if (!results) return ''
  return [
    '╔══════════════════════════╗',
    '║ Transworld Speed Test Pro ║',
    '╠══════════════════════════╣',
    `║ 📥 Download: ${results.download?.average?.toFixed(1) || '--'} Mbps`,
    `║ 📤 Upload:   ${results.upload?.average?.toFixed(1) || '--'} Mbps`,
    `║ 📶 Ping:     ${results.ping?.average?.toFixed(0) || '--'} ms`,
    `║ ⚡ Jitter:   ${results.jitter?.average?.toFixed(1) || '--'} ms`,
    `║ 📊 Packet Loss: ${results.packetLoss?.lossPercent?.toFixed(1) || '0'}%`,
    '╚══════════════════════════╝',
    'Tested at speedtest-transworld.vercel.app',
  ].join('\n')
}
