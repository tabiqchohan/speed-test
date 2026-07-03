import { useState, useCallback, useEffect, useRef } from 'react'
import { formatSpeed } from '../../shared/helpers.js'
import { getRecommendations } from '../../shared/recommendations.js'
import {
  testPing, testJitter, testPacketLoss, testDNS,
  testDownload, testUpload, testBufferbloat, testStability,
  testAllGamingServers, detectThrottling,
} from '../../shared/speedTest.js'

const API_BASE = '/api'
const IS_VERCEL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
const PHASE_LABELS = {
  ping: 'Ping', jitter: 'Jitter', packet_loss: 'Packet Loss',
  dns: 'DNS', download: 'Download', upload: 'Upload',
  bufferbloat: 'Bufferbloat', stability: 'Stability',
  gaming: 'Gaming Servers', idle: '', complete: 'Complete',
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('tw_history') || '[]') } catch { return [] }
}

function saveHistory(results) {
  const history = loadHistory()
  history.unshift({ id: Date.now(), date: new Date().toISOString(), ...results })
  localStorage.setItem('tw_history', JSON.stringify(history.slice(0, 100)))
}

function StabGrade({ score }) {
  if (score == null) return <span className="text-gray-500">--</span>
  const color = score >= 90 ? 'text-green-400' : score >= 70 ? 'text-yellow-400' : score >= 50 ? 'text-orange-400' : 'text-red-400'
  return <span className={color}>{score}</span>
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
      .then(d => setNetworkInfo(p => ({ ...p, ...d })))
      .catch(() => {
        fetch('https://ip-api.com/json/?fields=status,isp,org,city,country,query')
          .then(r => r.json())
          .then(d => {
            if (d.status === 'success') {
              setNetworkInfo(p => ({ ...p, isp: d.isp || d.org, ip: d.query, city: d.city }))
            }
          })
          .catch(() => {})
      })
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

    const serverUrl = ''
    const planSpeed = parseFloat(localStorage.getItem('tw_plan_speed') || '0')

    const onProgress = (p) => setPhase(p.phase)

    onProgress({ phase: 'ping' })
    const ping = await testPing(serverUrl, { count: 3 })

    onProgress({ phase: 'jitter' })
    const jitter = await testJitter(serverUrl, { count: 10 })

    onProgress({ phase: 'packet_loss' })
    const packetLoss = await testPacketLoss(serverUrl, { count: 5 })

    onProgress({ phase: 'dns' })
    const dns = await testDNS()

    onProgress({ phase: 'download' })
    const download = await testDownload(serverUrl, {
      size: 5242880, samples: 2, useCDN: IS_VERCEL,
      onLiveSpeed: (d) => { speedRef.current = d.currentMbps },
    })

    onProgress({ phase: 'upload' })
    const upload = await testUpload(serverUrl, {
      size: 1048576, samples: 2,
    })

    onProgress({ phase: 'bufferbloat' })
    const bufferbloat = await testBufferbloat(serverUrl)

    onProgress({ phase: 'stability' })
    const stability = await testStability(serverUrl, 3000)

    onProgress({ phase: 'gaming' })
    const gamingServers = await testAllGamingServers()

    let throttling = null
    if (planSpeed > 0) {
      throttling = await detectThrottling(serverUrl, planSpeed, { samples: 1 })
    }

    onProgress({ phase: 'complete' })

    const res = { ping, jitter, packetLoss, dns, download, upload, bufferbloat, stability, gamingServers, throttling, timestamp: new Date().toISOString() }

    speedRef.current = download?.average || 0
    setTimeout(() => {
      setResults(res)
      setTesting(false)
      setPhase('idle')
      saveHistory(res)
    }, 300)
  }, [])

  const recs = results?.download?.average ? getRecommendations(results.download.average) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-[#0a1628] to-gray-900 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-2xl mx-auto w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            {networkInfo?.isp || 'Transworld'}&nbsp;·&nbsp;{networkInfo?.ip || ''}
            {networkInfo?.city && <>&nbsp;·&nbsp;{networkInfo.city}</>}
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
                  {PHASE_LABELS[phase] || phase}
                </span>
              )}
            </div>
          )}
        </div>

        {results && (
          <div className="w-full space-y-4 animate-fade-in mt-2">
            <div className="grid grid-cols-4 gap-3">
              <ResultCard label="Ping" value={results.ping?.average?.toFixed(0)} unit="ms" color="text-cyan-400" />
              <ResultCard label="Jitter" value={results.jitter?.average?.toFixed(1)} unit="ms" color="text-purple-400" />
              <ResultCard label="Download" value={results.download?.average?.toFixed(1)} unit="Mbps" color="text-blue-400" />
              <ResultCard label="Upload" value={results.upload?.average?.toFixed(1)} unit="Mbps" color="text-green-400" />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <ResultCard label="Packet Loss" value={results.packetLoss?.lossPercent?.toFixed(1)} unit="%" color={results.packetLoss?.lossPercent > 0 ? 'text-red-400' : 'text-green-400'} />
              <ResultCard label="DNS" value={results.dns?.average?.toFixed(0)} unit="ms" color="text-yellow-400" />
              <ResultCard label="Bufferbloat" value={results.bufferbloat?.bufferbloat?.toFixed(0)} unit="ms" color="text-orange-400" />
              <ResultCard label="Stability" value={<StabGrade score={results.stability?.score} />} unit="" color="" />
            </div>

            {recs && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">What you can do</div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: recs.activity.color }} />
                  <span className="text-sm text-gray-300">{recs.activity.label}</span>
                </div>
                {recs.games.games.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                    <span>🎮</span>
                    <span>{recs.games.games.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {results.gamingServers && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Gaming Servers</div>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(results.gamingServers).map(([key, server]) => (
                    <div key={key} className="text-center">
                      <div className="text-[10px] text-gray-500 truncate">{server?.name || key}</div>
                      <div className={`text-sm font-bold ${server?.ping <= 50 ? 'text-green-400' : server?.ping <= 100 ? 'text-yellow-400' : server?.ping <= 200 ? 'text-orange-400' : 'text-red-400'}`}>
                        {server?.ping || '--'}
                        <span className="text-[10px] text-gray-600 ml-0.5">ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.throttling && (
              <div className={`rounded-xl p-3 border text-sm ${results.throttling.isThrottled ? 'bg-red-900/20 border-red-500/30 text-red-300' : 'bg-green-900/20 border-green-500/30 text-green-300'}`}>
                {results.throttling.isThrottled
                  ? `Throttling detected: ${results.throttling.actualSpeed} Mbps of ${results.throttling.planSpeed} Mbps plan (${results.throttling.ratio}%)`
                  : `Plan speed ${results.throttling.planSpeed} Mbps: achieving ${results.throttling.actualSpeed} Mbps`}
              </div>
            )}

            <div className="text-center pt-2">
              <button onClick={handleStart} className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-all">
                Test Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ResultCard({ label, value, unit, color }) {
  return (
    <div className="text-center">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color || 'text-white'}`}>
        {value ?? '--'}
        {unit && <span className="text-xs text-gray-600 ml-0.5">{unit}</span>}
      </div>
    </div>
  )
}
