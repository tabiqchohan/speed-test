import { processResults, calculateConfidence } from './accuracy.js'
import { calculateMbps } from './helpers.js'
import {
  SAMPLE_COUNT, PACKET_LOSS_COUNT, JITTER_SAMPLE_COUNT,
  DOWNLOAD_TIMEOUT, UPLOAD_TIMEOUT, PING_TIMEOUT, DNS_TIMEOUT,
  BUFFERBLOAT_SAMPLE_COUNT, STABILITY_SAMPLE_INTERVAL,
  THROTTLING_THRESHOLD, GAME_SERVERS, TEST_FILE_SIZES
} from './constants.js'

export async function testPing(serverUrl, options = {}) {
  const count = options.count || SAMPLE_COUNT
  const pings = []

  for (let i = 0; i < count; i++) {
    const start = performance.now()
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT)
      await fetch(serverUrl + '/api/ping', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
        mode: 'cors',
      })
      clearTimeout(timeout)
      const end = performance.now()
      pings.push(end - start)
    } catch {
      pings.push(null)
    }
  }

  const results = processResults(pings.filter(p => p !== null))
  return {
    ...results,
    unit: 'ms',
    confidence: calculateConfidence(pings.filter(p => p !== null)),
  }
}

export async function testJitter(serverUrl, options = {}) {
  const count = options.count || JITTER_SAMPLE_COUNT
  const pings = []

  for (let i = 0; i < count; i++) {
    const start = performance.now()
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT)
      await fetch(serverUrl + '/api/ping', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
        mode: 'cors',
      })
      clearTimeout(timeout)
      const end = performance.now()
      pings.push(end - start)
    } catch {
      pings.push(null)
    }
  }

  const valid = pings.filter(p => p !== null)
  let jitterVal = 0
  if (valid.length >= 2) {
    const diffs = []
    for (let i = 1; i < valid.length; i++) {
      diffs.push(Math.abs(valid[i] - valid[i - 1]))
    }
    jitterVal = diffs.reduce((a, b) => a + b, 0) / diffs.length
  }

  return {
    average: jitterVal,
    samples: valid.length,
    raw: valid,
    unit: 'ms',
  }
}

const PUBLIC_CDN_URLS = [
  { url: 'https://speed.cloudflare.com/__down?bytes=', name: 'Cloudflare' },
  { url: 'https://proof.ovh.net/files/', name: 'OVH' },
]

export async function testDownload(serverUrl, options = {}) {
  const size = options.size || TEST_FILE_SIZES.MEDIUM
  const sizeParam = size === TEST_FILE_SIZES.SMALL ? '10mb' : size === TEST_FILE_SIZES.LARGE ? '100mb' : '50mb'
  const count = options.samples || SAMPLE_COUNT
  const speeds = []
  const progressCb = options.onProgress || (() => {})
  const useCDN = options.useCDN || false
  const cdnUrls = options.cdnUrls || PUBLIC_CDN_URLS
  const cdnIndex = options.cdnIndex || 0

  for (let i = 0; i < count; i++) {
    progressCb({ phase: 'download', sample: i + 1, total: count, percent: (i / count) * 100 })
    const start = performance.now()
    let loadedBytes = 0

    let downloadUrl
    if (useCDN) {
      const cdn = cdnUrls[cdnIndex % cdnUrls.length]
      const byteSize = size === TEST_FILE_SIZES.SMALL ? 10485760 : size === TEST_FILE_SIZES.LARGE ? 104857600 : 52428800
      downloadUrl = cdn.url + byteSize
    } else {
      downloadUrl = `${serverUrl}/api/download?size=${sizeParam}`
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT)

      const response = await fetch(downloadUrl, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
        mode: 'cors',
      })

      clearTimeout(timeout)

      if (!response.ok) continue

      const reader = response.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        loadedBytes += value.length
      }

      const end = performance.now()
      const timeMs = end - start
      if (timeMs > 0 && loadedBytes > 0) {
        speeds.push(calculateMbps(loadedBytes, timeMs))
      }
    } catch {
      continue
    }
  }

  progressCb({ phase: 'download', sample: count, total: count, percent: 100 })

  const results = processResults(speeds)
  return {
    ...results,
    unit: 'Mbps',
    totalBytes: speeds.reduce((a, b) => a + b, 0) > 0 ? TEST_FILE_SIZES[speedKey(size)] : 0,
    confidence: calculateConfidence(speeds),
  }
}

function speedKey(size) {
  if (size === TEST_FILE_SIZES.SMALL) return 'SMALL'
  if (size === TEST_FILE_SIZES.LARGE) return 'LARGE'
  return 'MEDIUM'
}

export async function testUpload(serverUrl, options = {}) {
  const size = options.size || TEST_FILE_SIZES.SMALL
  const count = options.samples || SAMPLE_COUNT
  const speeds = []
  const progressCb = options.onProgress || (() => {})

  for (let i = 0; i < count; i++) {
    progressCb({ phase: 'upload', sample: i + 1, total: count, percent: (i / count) * 100 })
    const data = new Uint8Array(size)
    for (let j = 0; j < data.length; j += 65536) {
      data.set(new Uint8Array(Math.min(65536, data.length - j)).map(() => Math.floor(Math.random() * 256)), j)
    }

    const start = performance.now()
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT)

      const response = await fetch(serverUrl + '/api/upload', {
        method: 'POST',
        body: data,
        signal: controller.signal,
        cache: 'no-store',
        mode: 'cors',
      })

      clearTimeout(timeout)

      if (!response.ok) continue
      const end = performance.now()
      const timeMs = end - start
      if (timeMs > 0) {
        speeds.push(calculateMbps(size, timeMs))
      }
    } catch {
      continue
    }
  }

  progressCb({ phase: 'upload', sample: count, total: count, percent: 100 })

  const results = processResults(speeds)
  return {
    ...results,
    unit: 'Mbps',
    totalBytes: size,
    confidence: calculateConfidence(speeds),
  }
}

export async function testPacketLoss(serverUrl, options = {}) {
  const count = options.count || PACKET_LOSS_COUNT
  let lost = 0
  let sent = 0

  for (let i = 0; i < count; i++) {
    sent++
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT)
      await fetch(serverUrl + '/api/ping', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
        mode: 'cors',
      })
      clearTimeout(timeout)
    } catch {
      lost++
    }
  }

  const lossPercent = (lost / sent) * 100
  return {
    sent,
    received: sent - lost,
    lost,
    lossPercent: Math.round(lossPercent * 10) / 10,
    quality: lossPercent === 0 ? 'Excellent' : lossPercent <= 1 ? 'Good' : lossPercent <= 3 ? 'Fair' : 'Poor',
  }
}

export async function testDNS(domain = 'google.com', options = {}) {
  const servers = options.dnsServers || ['https://dns.google/resolve', 'https://cloudflare-dns.com/dns-query']
  const results = []

  for (const dnsServer of servers) {
    const start = performance.now()
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), DNS_TIMEOUT)
      const url = `${dnsServer}?name=${domain}&type=A`
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/dns-json' },
      })
      clearTimeout(timeout)
      if (response.ok) {
        const end = performance.now()
        results.push(end - start)
      }
    } catch {
      continue
    }
  }

  return {
    average: results.length > 0 ? results.reduce((a, b) => a + b, 0) / results.length : 0,
    results,
    unit: 'ms',
  }
}

export async function testBufferbloat(serverUrl, options = {}) {
  const idlePing = await testPing(serverUrl, { count: 3 })
  const underLoadPings = []

  const controller = new AbortController()
  const loadTimeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(`${serverUrl}/api/download?size=50mb`, {
      signal: controller.signal,
      cache: 'no-store',
      mode: 'cors',
    })

    const reader = response.body.getReader()

    const pingInterval = setInterval(async () => {
      const start = performance.now()
      try {
        await fetch(serverUrl + '/api/ping', {
          method: 'GET',
          cache: 'no-store',
          mode: 'cors',
        })
        underLoadPings.push(performance.now() - start)
      } catch {}
    }, 500)

    while (true) {
      const { done } = await reader.read()
      if (done) break
    }

    clearInterval(pingInterval)
    clearTimeout(loadTimeout)

    const loadAvg = underLoadPings.length > 0
      ? underLoadPings.reduce((a, b) => a + b, 0) / underLoadPings.length
      : 0

    const bloat = loadAvg - (idlePing.average || 0)

    return {
      idleLatency: idlePing.average,
      underLoadLatency: loadAvg,
      bufferbloat: Math.max(0, bloat),
      grade: bloat <= 10 ? 'A' : bloat <= 30 ? 'B' : bloat <= 100 ? 'C' : 'D',
      unit: 'ms',
    }
  } catch {
    clearTimeout(loadTimeout)
    return { idleLatency: idlePing.average, underLoadLatency: 0, bufferbloat: 0, grade: 'N/A', unit: 'ms' }
  }
}

export async function testGamingServer(serverKey) {
  const server = GAME_SERVERS[serverKey]
  if (!server) return null

  const pings = []
  for (let i = 0; i < 5; i++) {
    const start = performance.now()
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT)
      await fetch(`https://${server.host}/`, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors',
        cache: 'no-store',
      })
      clearTimeout(timeout)
      pings.push(performance.now() - start)
    } catch {
      pings.push(null)
    }
  }

  const valid = pings.filter(p => p !== null)
  const avg = valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0
  const grade = avg <= 50 ? '🟢' : avg <= 100 ? '🟡' : avg <= 200 ? '🟠' : '🔴'

  return {
    name: server.name,
    ping: Math.round(avg),
    grade,
    valid: valid.length,
  }
}

export async function testAllGamingServers() {
  const results = {}
  for (const key of Object.keys(GAME_SERVERS)) {
    results[key] = await testGamingServer(key)
  }
  return results
}

export async function testStability(serverUrl, durationMs = 10000) {
  const samples = []
  const interval = STABILITY_SAMPLE_INTERVAL
  const count = Math.floor(durationMs / interval)

  for (let i = 0; i < count; i++) {
    const start = performance.now()
    try {
      await fetch(serverUrl + '/api/ping', {
        method: 'GET',
        cache: 'no-store',
        mode: 'cors',
      })
      samples.push(performance.now() - start)
    } catch {
      samples.push(null)
    }
    await new Promise(r => setTimeout(r, interval))
  }

  const valid = samples.filter(s => s !== null)
  const avg = valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0
  const maxDev = valid.length > 0 ? Math.max(...valid.map(s => Math.abs(s - avg))) : 0
  const score = avg > 0 ? Math.max(0, Math.min(100, Math.round(100 - (maxDev / avg) * 50))) : 0
  const grade = score >= 90 ? '🟢 Excellent' : score >= 70 ? '🟡 Good' : score >= 50 ? '🟠 Fair' : '🔴 Poor'

  return {
    score,
    grade,
    average: avg,
    samples: valid.length,
    unit: 'ms',
  }
}

export async function detectThrottling(serverUrl, planSpeed, options = {}) {
  const downloadResult = await testDownload(serverUrl, { samples: 3, ...options })
  const actualSpeed = downloadResult.average
  const ratio = actualSpeed / planSpeed

  return {
    planSpeed,
    actualSpeed: Math.round(actualSpeed * 10) / 10,
    ratio: Math.round(ratio * 100),
    isThrottled: ratio < THROTTLING_THRESHOLD,
    severity: ratio >= 0.8 ? 'None' : ratio >= 0.5 ? 'Mild' : ratio >= 0.3 ? 'Moderate' : 'Severe',
  }
}

export async function runFullTest(serverUrl, options = {}) {
  const onProgress = options.onProgress || (() => {})
  const planSpeed = options.planSpeed || 0
  const testSize = options.testSize || 'medium'
  const useCDN = options.useCDN || false

  const sizeMap = { small: TEST_FILE_SIZES.SMALL, medium: TEST_FILE_SIZES.MEDIUM, large: TEST_FILE_SIZES.LARGE }
  const size = sizeMap[testSize] || TEST_FILE_SIZES.MEDIUM

  const testState = { phase: 'starting', percent: 0 }

  const updateProgress = (phase, percent) => {
    testState.phase = phase
    testState.percent = percent
    onProgress({ ...testState })
  }

  updateProgress('ping', 5)
  const ping = await testPing(serverUrl)

  updateProgress('jitter', 15)
  const jitter = await testJitter(serverUrl)

  updateProgress('packet_loss', 20)
  const packetLoss = await testPacketLoss(serverUrl)

  updateProgress('dns', 25)
  const dns = await testDNS()

  updateProgress('download', 30)
  const download = await testDownload(serverUrl, {
    size,
    samples: 3,
    useCDN,
    onProgress: (p) => updateProgress('download', 30 + (p.percent * 0.3)),
  })

  updateProgress('upload', 65)
  const upload = await testUpload(serverUrl, {
    size: useCDN ? TEST_FILE_SIZES.SMALL : TEST_FILE_SIZES.SMALL,
    samples: 3,
    useCDN: false,
    onProgress: (p) => updateProgress('upload', 65 + (p.percent * 0.15)),
  })

  updateProgress('bufferbloat', 85)
  const bufferbloat = await testBufferbloat(serverUrl)

  updateProgress('stability', 90)
  const stability = await testStability(serverUrl)

  updateProgress('gaming', 95)
  const gamingServers = await testAllGamingServers()

  let throttling = null
  if (planSpeed > 0) {
    throttling = await detectThrottling(serverUrl, planSpeed, { samples: 1 })
  }

  updateProgress('complete', 100)

  return {
    timestamp: new Date().toISOString(),
    server: serverUrl,
    testSize: testSize,
    ping,
    jitter,
    packetLoss,
    dns,
    download,
    upload,
    bufferbloat,
    stability,
    gamingServers,
    throttling,
  }
}
