import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { runFullTest } from '../../shared/speedTest.js'
import { formatSpeed } from '../../shared/helpers.js'
import { findServerById } from '../../shared/servers.js'
import { detectConnectionType } from '../../shared/connectionTypes.js'

const API_BASE = '/api'
const IS_VERCEL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('tw_history') || '[]') } catch { return [] }
}

function saveHistory(results) {
  const history = loadHistory()
  history.unshift({ ...results, id: Date.now(), date: new Date().toISOString() })
  localStorage.setItem('tw_history', JSON.stringify(history.slice(0, 100)))
}

const PHASES = [
  { key: 'idle', label: 'Ready' },
  { key: 'ping', label: 'Ping Test' },
  { key: 'jitter', label: 'Jitter Test' },
  { key: 'packet_loss', label: 'Packet Loss' },
  { key: 'dns', label: 'DNS Test' },
  { key: 'download', label: 'Download Test' },
  { key: 'upload', label: 'Upload Test' },
  { key: 'bufferbloat', label: 'Bufferbloat' },
  { key: 'stability', label: 'Stability' },
  { key: 'gaming', label: 'Gaming Ping' },
  { key: 'complete', label: 'Complete' },
]

export default function HomePage() {
  const { t } = useTranslation()
  const [phase, setPhase] = useState('idle')
  const [liveSpeed, setLiveSpeed] = useState(0)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState(null)
  const [selectedServer, setSelectedServer] = useState('auto')
  const [planSpeed, setPlanSpeed] = useState(() => parseInt(localStorage.getItem('tw_plan') || '0'))
  const [testSize, setTestSize] = useState(() => localStorage.getItem('tw_testSize') || 'medium')
  const [networkInfo, setNetworkInfo] = useState(null)
  const [testing, setTesting] = useState(false)
  const [currentResult, setCurrentResult] = useState({})
  const speedRef = useRef(0)
  const animRef = useRef(null)

  const phaseIndex = PHASES.findIndex(p => p.key === phase)
  const displaySpeed = formatSpeed(liveSpeed * 1000000)

  useEffect(() => {
    fetch(API_BASE + '/isp-lookup')
      .then(r => r.json())
      .catch(() => ({}))
      .then(data => {
        setNetworkInfo(prev => ({ ...prev, ...data }))
      })

    if ('connection' in navigator) {
      const conn = navigator.connection
      setNetworkInfo(prev => ({
        ...prev,
        type: conn.type || 'unknown',
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
      }))
    }
  }, [])

  useEffect(() => {
    if (!testing) return
    let last = performance.now()
    const animate = (now) => {
      const current = speedRef.current
      setLiveSpeed(prev => {
        const diff = current - prev
        return prev + diff * 0.15
      })
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [testing])

  const handleStart = useCallback(async () => {
    setTesting(true)
    setResults(null)
    setCurrentResult({})
    setLiveSpeed(0)
    speedRef.current = 0
    setProgress(0)
    setPhase('ping')

    let serverUrl = API_BASE
    if (selectedServer !== 'auto') {
      const srv = findServerById(selectedServer)
      if (srv) setNetworkInfo(prev => ({ ...prev, serverName: `${srv.isp} - ${srv.city}` }))
    }

    try {
      const fullResults = await runFullTest(serverUrl, {
        planSpeed,
        testSize,
        useCDN: IS_VERCEL,
        onProgress: (p) => {
          setPhase(p.phase)
          setProgress(p.percent)
        },
        onLiveSpeed: (data) => {
          speedRef.current = data.currentMbps
        },
      })

      speedRef.current = fullResults.download?.average || 0
      setTimeout(() => {
        setResults(fullResults)
        setPhase('complete')
        setTesting(false)
        saveHistory(fullResults)
        if (fullResults.throttling) setPlanSpeed(fullResults.throttling.planSpeed)
      }, 500)
    } catch (err) {
      console.error('Test failed:', err)
      setTesting(false)
      setPhase('idle')
    }
  }, [selectedServer, planSpeed, testSize])

  const connType = networkInfo ? detectConnectionType(networkInfo) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-800/80 text-sm mb-3">
            <span className={`w-2 h-2 rounded-full ${phase === 'idle' || phase === 'complete' ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
            {networkInfo?.isp || 'Transworld'} — {connType?.icon} {connType?.label || 'Connecting...'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Transworld Speed Test</h1>
          <p className="text-gray-400 text-sm mt-1">Pakistan's Most Comprehensive Speed Test</p>
        </div>

        <div className="flex items-center justify-center my-6">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="85" fill="none" stroke="#1e293b" strokeWidth="8" />
              <circle
                cx="100" cy="100" r="85" fill="none" stroke="url(#gaugeGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(Math.min(liveSpeed, 500) / 500) * 534} 534`}
                className="transition-all duration-300 ease-out"
              />
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0055A5" />
                  <stop offset="100%" stopColor="#00B4D8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl sm:text-6xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {displaySpeed.value}
                </span>
              </div>
              <div className="text-gray-400 text-lg font-medium mt-1">{displaySpeed.unit}</div>
              {phase !== 'idle' && phase !== 'complete' && (
                <div className="text-gray-500 text-xs mt-2 font-medium tracking-wide uppercase">
                  {PHASES.find(p => p.key === phase)?.label || phase}
                </div>
              )}
            </div>
          </div>
        </div>

        {phase !== 'idle' && phase !== 'complete' && (
          <div className="max-w-xs mx-auto mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-gray-700/50">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Ping</div>
            <div className="text-xl font-bold text-cyan-400">
              {results ? results.ping?.average?.toFixed(0) || '—' : phase === 'ping' ? '✓' : '—'}
              {results ? <span className="text-xs text-gray-500 ml-1">ms</span> : ''}
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-gray-700/50">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Jitter</div>
            <div className="text-xl font-bold text-purple-400">
              {results ? results.jitter?.average?.toFixed(1) || '—' : phase === 'jitter' ? '✓' : '—'}
              {results ? <span className="text-xs text-gray-500 ml-1">ms</span> : ''}
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-gray-700/50">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Download</div>
            <div className="text-xl font-bold text-blue-400">
              {results ? results.download?.average?.toFixed(1) || '—' : phase === 'download' ? (
                <span className="text-base font-mono">{displaySpeed.value} {displaySpeed.unit}</span>
              ) : '—'}
              {results ? <span className="text-xs text-gray-500 ml-1">Mbps</span> : ''}
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-gray-700/50">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Upload</div>
            <div className="text-xl font-bold text-green-400">
              {results ? results.upload?.average?.toFixed(1) || '—' : phase === 'upload' ? (
                <span className="text-base font-mono">{displaySpeed.value} {displaySpeed.unit}</span>
              ) : '—'}
              {results ? <span className="text-xs text-gray-500 ml-1">Mbps</span> : ''}
            </div>
          </div>
        </div>

        {phase === 'idle' && (
          <div className="text-center">
            <button onClick={handleStart} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-16 rounded-full text-lg shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95">
              START
            </button>
            <div className="mt-3 text-xs text-gray-500">
              {networkInfo?.ip ? `IP: ${networkInfo.ip}` : ''} &middot; {selectedServer === 'auto' ? 'Auto Server' : findServerById(selectedServer)?.isp}
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-3 animate-fade-in mt-4">
            {results.packetLoss && (
              <div className="flex justify-center">
                <div className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  results.packetLoss.lossPercent === 0 ? 'bg-green-900/50 text-green-400' :
                  results.packetLoss.lossPercent <= 1 ? 'bg-yellow-900/50 text-yellow-400' :
                  'bg-red-900/50 text-red-400'
                }`}>
                  Packet Loss: {results.packetLoss.lossPercent}%
                </div>
              </div>
            )}

            <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">Speed Recommendations</div>
              <div className="text-sm text-gray-300">
                {results.download?.average < 1 ? 'Basic browsing & messaging' :
                 results.download?.average < 3 ? 'SD YouTube, music, WhatsApp calls' :
                 results.download?.average < 5 ? 'HD YouTube, Zoom, PUBG Lite' :
                 results.download?.average < 10 ? '1080p streaming, Valorant, COD' :
                 results.download?.average < 25 ? '4K streaming, GTA Online, Apex' :
                 results.download?.average < 50 ? 'Multiple streams, all games smooth' :
                 'Pro streaming + gaming, ultra settings'}
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center flex-wrap">
              <button onClick={handleStart} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-10 rounded-full shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95">
                Test Again
              </button>
            </div>
          </div>
        )}

        {phase === 'complete' && !results && (
          <div className="text-center mt-4">
            <button onClick={handleStart} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-10 rounded-full shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95">
              Start Test
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
