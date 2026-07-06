export function formatSpeed(kbps: number) {
  if (kbps >= 1000000) {
    return { value: (kbps / 1000000).toFixed(2), unit: 'Gbps', kbps: Math.round(kbps) }
  }
  if (kbps >= 1000) {
    return { value: (kbps / 1000).toFixed(1), unit: 'Mbps', kbps: Math.round(kbps) }
  }
  return { value: Math.round(kbps), unit: 'Kbps', kbps: Math.round(kbps) }
}

export function formatLatency(ms: number) {
  if (ms < 1) return { value: (ms * 1000).toFixed(0), unit: 'μs' }
  return { value: ms.toFixed(0), unit: 'ms' }
}

export function formatBytes(bytes: number) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB'
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return bytes + ' B'
}

export function average(values: number[]) {
  if (!values || values.length === 0) return 0
  const sum = values.reduce((a, b) => a + b, 0)
  return sum / values.length
}

export function median(values: number[]) {
  if (!values || values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function jitter(values: number[]) {
  if (!values || values.length < 2) return 0
  const diffs: number[] = []
  for (let i = 1; i < values.length; i++) {
    diffs.push(Math.abs(values[i] - values[i - 1]))
  }
  return average(diffs)
}

export function packetLoss(sent: number, received: number) {
  if (sent === 0) return 0
  return ((sent - received) / sent) * 100
}

export function removeOutliers(values: number[]) {
  if (!values || values.length < 4) return values
  const sorted = [...values].sort((a, b) => a - b)
  sorted.shift()
  sorted.pop()
  return sorted
}

export function stabilityScore(samples: number[]) {
  if (!samples || samples.length < 2) return 100
  const avg = average(samples)
  if (avg === 0) return 0
  const maxDev = Math.max(...samples.map(s => Math.abs(s - avg)))
  const score = Math.max(0, 100 - (maxDev / avg) * 50)
  return Math.round(score)
}

export function calculateMbps(bytes: number, timeMs: number) {
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

export function calcNetworkQuality({ download, upload, ping, jitter, packetLoss, stability }: any) {
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

export function calcConsistency(samples: number[]) {
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

export function getWiFiAdvice(connectionType: any, speed: number, consistency?: number) {
  if (connectionType?.id !== 'wifi') return null
  const issues: string[] = []
  if (speed < 10) issues.push('Router ko open space mein rakhain, walls aur obstacles se door')
  if (speed < 20 && speed >= 10) issues.push('5GHz WiFi band use karein agar router support karta hai')
  if (consistency != null && consistency < 50) issues.push('WiFi interference ho sakta hai — router channel change karein')
  if (issues.length === 0) return { type: 'good', msg: 'WiFi connection healthy hai', color: '#34d399', icon: '📡' as const }
  return { type: 'warn', msg: issues[0], color: '#fbbf24', icon: '⚠️' as const }
}

export function getEthernetAdvice(connectionType: any, speed: number) {
  if (connectionType?.id === 'wifi' && speed < 20) {
    return { msg: 'Ethernet cable use karein for faster & stable connection', color: '#fb923c', icon: '🔌' as const }
  }
  return null
}

export function getComparativePercentile(ispData: any, userSpeed: number) {
  if (!ispData || !ispData.avgDownload) return null
  const ratio = userSpeed / ispData.avgDownload
  const pct = Math.round(Math.min(99, Math.max(1, ratio * 50 + 50)))
  return pct
}

export function generateResultCard(results: any) {
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

export function downloadResultCardPNG(results: any) {
  if (!results) return

  const canvas = document.createElement('canvas')
  canvas.width = 600
  canvas.height = 400
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, 600, 400)

  const grad = ctx.createLinearGradient(0, 0, 600, 0)
  grad.addColorStop(0, '#0055A5')
  grad.addColorStop(1, '#22d3ee')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 600, 60)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 22px system-ui'
  ctx.fillText('Transworld Speed Test Pro', 20, 38)

  ctx.font = '14px system-ui'
  const data = [
    { label: 'Download', value: `${results.download?.average?.toFixed(1) || '--'} Mbps`, color: '#60a5fa' },
    { label: 'Upload', value: `${results.upload?.average?.toFixed(1) || '--'} Mbps`, color: '#34d399' },
    { label: 'Ping', value: `${results.ping?.average?.toFixed(0) || '--'} ms`, color: '#22d3ee' },
    { label: 'Jitter', value: `${results.jitter?.average?.toFixed(1) || '--'} ms`, color: '#a78bfa' },
    { label: 'Packet Loss', value: `${results.packetLoss?.lossPercent?.toFixed(1) || '0'}%`, color: results.packetLoss?.lossPercent > 0 ? '#f87171' : '#34d399' },
  ]

  data.forEach((d, i) => {
    const y = 100 + i * 50
    ctx.fillStyle = '#94a3b8'
    ctx.font = '13px system-ui'
    ctx.fillText(d.label, 20, y)
    ctx.fillStyle = d.color
    ctx.font = 'bold 18px system-ui'
    ctx.fillText(d.value, 20, y + 22)
  })

  ctx.fillStyle = '#64748b'
  ctx.font = '11px system-ui'
  ctx.fillText('Tested at speedtest-transworld.vercel.app', 20, 365)

  ctx.textAlign = 'right'
  ctx.fillText(new Date().toLocaleDateString(), 580, 365)

  const link = document.createElement('a')
  link.download = `speed-result-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}
