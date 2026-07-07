export function collectSamples(fn: (i: number) => number, count = 5) {
  const samples: number[] = []
  for (let i = 0; i < count; i++) {
    samples.push(fn(i))
  }
  return samples
}

export function processResults(samples: number[]) {
  if (!samples || samples.length === 0) return { average: 0, median: 0, min: 0, max: 0, jitter: 0 }

  const valid = samples.filter(s => s !== null && s !== undefined && isFinite(s))
  if (valid.length === 0) return { average: 0, median: 0, min: 0, max: 0, jitter: 0 }

  const sorted = [...valid].sort((a, b) => a - b)
  const cleaned = valid.length >= 4 ? sorted.slice(1, -1) : sorted

  const sum = cleaned.reduce((a, b) => a + b, 0)
  const avg = sum / cleaned.length
  const mid = Math.floor(cleaned.length / 2)
  const med = cleaned.length % 2 !== 0 ? cleaned[mid] : (cleaned[mid - 1] + cleaned[mid]) / 2

  let jitterVal = 0
  if (cleaned.length >= 2) {
    const diffs: number[] = []
    for (let i = 1; i < cleaned.length; i++) {
      diffs.push(Math.abs(cleaned[i] - cleaned[i - 1]))
    }
    jitterVal = diffs.reduce((a, b) => a + b, 0) / diffs.length
  }

  return {
    average: avg,
    median: med,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    jitter: jitterVal,
    samples: cleaned.length,
    raw: valid,
  }
}

export function calculateConfidence(samples: number[]) {
  if (!samples || samples.length < 2) return 0
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  if (mean === 0) return 0
  const variance = samples.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / samples.length
  const stdDev = Math.sqrt(variance)
  const cv = stdDev / mean
  const confidence = Math.max(0, Math.min(100, (1 - cv) * 100))
  return Math.round(confidence)
}
