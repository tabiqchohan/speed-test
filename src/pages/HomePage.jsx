import { useState, useCallback, useEffect, useRef } from 'react'
import { formatSpeed } from '../../shared/helpers.js'

const API_BASE = '/api'
const IS_VERCEL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('tw_history') || '[]') } catch { return [] }
}

function saveHistory(results) {
  const history = loadHistory()
  history.unshift({ ...results, id: Date.now(), date: new Date().toISOString() })
  localStorage.setItem('tw_history', JSON.stringify(history.slice(0, 100)))
}

async function testPing() {
  const pings = []
  for (let i = 0; i < 3; i++) {
    const start = performance.now()
    try {
      const c = new AbortController()
      setTimeout(() => c.abort(), 3000)
      await fetch(API_BASE + '/ping', { signal: c.signal, cache: 'no-store' })
      pings.push(performance.now() - start)
    } catch {}
  }
  const valid = pings.filter(p => p !== null)
  return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0
}

async function testDownload(onLive) {
  const size = 5242880
  const start = performance.now()
  let loaded = 0
  try {
    const c = new AbortController()
    setTimeout(() => c.abort(), 8000)
    const url = IS_VERCEL
      ? `https://speed.cloudflare.com/__down?bytes=${size}`
      : `${API_BASE}/download?size=5mb`
    const res = await fetch(url, { signal: c.signal, cache: 'no-store' })
    if (!res.ok) return 0
    const reader = res.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      loaded += value.length
      const elapsed = performance.now() - start
      if (elapsed > 0) onLive((loaded * 8) / elapsed / 1000)
    }
    const elapsed = performance.now() - start
    return elapsed > 0 ? (loaded * 8) / elapsed / 1000 : 0
  } catch { return 0 }
}

async function testUpload(onLive) {
  const size = 524288
  const data = new Uint8Array(size).map(() => Math.random() * 256)
  const start = performance.now()
  try {
    const c = new AbortController()
    setTimeout(() => c.abort(), 5000)
    const url = IS_VERCEL
      ? 'https://speed.cloudflare.com/__up'
      : API_BASE + '/upload'
    await fetch(url, {
      method: 'POST', body: data, signal: c.signal, cache: 'no-store',
    })
    const elapsed = performance.now() - start
    if (elapsed > 0) {
      const speed = (size * 8) / elapsed / 1000
      onLive(speed)
      return speed
    }
    return 0
  } catch { return 0 }
}

export default function HomePage() {
  const [phase, setPhase] = useState('idle')
  const [liveSpeed, setLiveSpeed] = useState(0)
  const [results, setResults] = useState(null)
  const [networkInfo, setNetworkInfo] = useState(null)
  const [testing, setTesting] = useState(false)
  const speedRef = useRef(0)
  const animRef = useRef(null)

  const display = formatSpeed(liveSpeed * 1000)

  useEffect(() => {
    fetch(API_BASE + '/isp-lookup')
      .then(r => r.json())
      .catch(() => ({}))
      .then(d => setNetworkInfo(p => ({ ...p, ...d })))
    if ('connection' in navigator) {
      setNetworkInfo(p => ({ ...p, ...navigator.connection }))
    }
  }, [])

  useEffect(() => {
    if (!testing) return
    const animate = () => {
      const target = speedRef.current
      setLiveSpeed(p => p + (target - p) * 0.2)
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [testing])

  const handleStart = useCallback(async () => {
    setTesting(true)
    setResults(null)
    setLiveSpeed(0)
    speedRef.current = 0

    setPhase('ping')
    const ping = await testPing()

    setPhase('download')
    const download = await testDownload(s => { speedRef.current = s })

    setPhase('upload')
    const upload = await testUpload(s => { speedRef.current = s })

    const res = {
      ping: { average: ping },
      download: { average: download },
      upload: { average: upload },
      timestamp: new Date().toISOString(),
    }

    speedRef.current = download
    setTimeout(() => {
      setResults(res)
      setTesting(false)
      setPhase('idle')
      saveHistory(res)
    }, 300)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-[#0a1628] to-gray-900 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-lg mx-auto w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            {networkInfo?.isp || 'Transworld'} &middot; {networkInfo?.ip || ''}
          </div>
        </div>

        <div className="relative w-64 h-64 sm:w-72 sm:h-72 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="88" fill="none" stroke="#ffffff08" strokeWidth="6" />
            <circle
              cx="100" cy="100" r="88" fill="none" stroke="url(#g)"
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${(Math.min(liveSpeed, 500) / 500) * 553} 553`}
              className="transition-all duration-200"
            />
            <defs>
              <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0055A5" />
                <stop offset="100%" stopColor="#00B4D8" />
              </linearGradient>
            </defs>
          </svg>

          {phase === 'idle' && !results && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={handleStart}
                className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 shadow-2xl shadow-blue-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 font-bold text-2xl tracking-wider text-white"
              >
                GO
              </button>
            </div>
          )}

          {(phase !== 'idle' || results) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl sm:text-6xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {display.value}
                </span>
              </div>
              <div className="text-gray-500 text-base font-medium mt-0.5">{display.unit}</div>
              {testing && (
                <span className="text-xs text-gray-600 mt-2 font-medium tracking-widest uppercase">
                  {phase === 'ping' ? 'PING' : phase === 'download' ? 'DOWNLOAD' : 'UPLOAD'}
                </span>
              )}
            </div>
          )}
        </div>

        {results && (
          <div className="w-full grid grid-cols-3 gap-4 mt-4 animate-fade-in">
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ping</div>
              <div className="text-2xl font-bold text-cyan-400">
                {results.ping.average.toFixed(0)}
                <span className="text-xs text-gray-600 ml-0.5">ms</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Download</div>
              <div className="text-2xl font-bold text-blue-400">
                {results.download.average.toFixed(1)}
                <span className="text-xs text-gray-600 ml-0.5">Mbps</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Upload</div>
              <div className="text-2xl font-bold text-green-400">
                {results.upload.average.toFixed(1)}
                <span className="text-xs text-gray-600 ml-0.5">Mbps</span>
              </div>
            </div>
          </div>
        )}

        {results && (
          <div className="mt-8 text-center">
            <button onClick={handleStart} className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-all">
              Test Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
