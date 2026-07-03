import { useState, useCallback, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { formatSpeed } from '../../shared/helpers.js'
import { getRecommendations } from '../../shared/recommendations.js'
import { getAllISPs } from '../../shared/servers.js'
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
const VIDEO_QUALITY = [
  { min: 0, max: 0.5, label: 'Voice Only', color: 'text-red-400', icon: '📞' },
  { min: 0.5, max: 1, label: 'SD Video (360p)', color: 'text-orange-400', icon: '📹' },
  { min: 1, max: 2, label: 'HD Video (720p)', color: 'text-yellow-400', icon: '📹' },
  { min: 2, max: 4, label: 'Full HD (1080p)', color: 'text-lime-400', icon: '🎥' },
  { min: 4, max: 8, label: '4K / Group HD', color: 'text-green-400', icon: '🎥' },
  { min: 8, max: Infinity, label: 'Multi 4K Calls', color: 'text-cyan-400', icon: '📺' },
]
const SPEED_GRADES = [
  { min: 100, max: Infinity, grade: 'A+', color: 'text-purple-400', label: 'Legendary' },
  { min: 50, max: 100, grade: 'A', color: 'text-green-400', label: 'Excellent' },
  { min: 25, max: 50, grade: 'B', color: 'text-blue-400', label: 'Great' },
  { min: 10, max: 25, grade: 'C', color: 'text-yellow-400', label: 'Good' },
  { min: 5, max: 10, grade: 'D', color: 'text-orange-400', label: 'Fair' },
  { min: 0, max: 5, grade: 'F', color: 'text-red-400', label: 'Poor' },
]

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('tw_history') || '[]') } catch { return [] }
}
function saveHistory(results) {
  const history = loadHistory()
  history.unshift({ id: Date.now(), date: new Date().toISOString(), ...results })
  localStorage.setItem('tw_history', JSON.stringify(history.slice(0, 100)))
}
function getSettings(key, def) {
  try { return localStorage.getItem(key) || def } catch { return def }
}
function formatUnit(mbps, pref) {
  if (pref === 'Mbps') return { value: mbps.toFixed(1), unit: 'Mbps' }
  if (pref === 'Kbps') return { value: (mbps * 1000).toFixed(0), unit: 'Kbps' }
  if (pref === 'Gbps') return { value: (mbps / 1000).toFixed(2), unit: 'Gbps' }
  return formatSpeed(mbps * 1000)
}

function getVideoQuality(mbps) {
  return VIDEO_QUALITY.find(q => mbps >= q.min && mbps < q.max) || VIDEO_QUALITY[0]
}
function getSpeedGrade(mbps) {
  return SPEED_GRADES.find(g => mbps >= g.min && mbps < g.max) || SPEED_GRADES[5]
}

export default function HomePage() {
  const [phase, setPhase] = useState('idle')
  const [liveSpeed, setLiveSpeed] = useState(0)
  const [results, setResults] = useState(null)
  const [networkInfo, setNetworkInfo] = useState(null)
  const [testing, setTesting] = useState(false)
  const [speedSamples, setSpeedSamples] = useState([])
  const [selectedIsp, setSelectedIsp] = useState(() => getSettings('tw_server_isp', ''))
  const [unitPref, setUnitPref] = useState(() => getSettings('tw_unit', 'auto'))
  const speedRef = useRef(0)
  const animRef = useRef(null)
  const samplesRef = useRef([])
  const lastSampleRef = useRef(0)

  const display = formatUnit(liveSpeed, unitPref)

  useEffect(() => {
    fetch(API_BASE + '/isp-lookup')
      .then(r => r.json())
      .then(d => setNetworkInfo(p => ({ ...p, ...d })))
      .catch(() => {
        fetch('https://ip-api.com/json/?fields=status,isp,org,city,country,query')
          .then(r => r.json())
          .then(d => { if (d.status === 'success') setNetworkInfo(p => ({ ...p, isp: d.isp || d.org, ip: d.query, city: d.city })) })
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

  const collectSample = useCallback((mbps) => {
    const now = Date.now()
    if (now - lastSampleRef.current < 150) return
    lastSampleRef.current = now
    const next = [...samplesRef.current, { t: now, s: mbps }]
    if (next.length > 200) next.splice(0, next.length - 200)
    samplesRef.current = next
    setSpeedSamples(next)
  }, [])

  const handleStart = useCallback(async () => {
    setTesting(true)
    setResults(null)
    setLiveSpeed(0)
    speedRef.current = 0
    samplesRef.current = []
    setSpeedSamples([])

    const serverUrl = ''
    const planSpeed = parseFloat(getSettings('tw_plan', '0'))

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
      onLiveSpeed: (d) => { speedRef.current = d.currentMbps; collectSample(d.currentMbps) },
    })

    onProgress({ phase: 'upload' })
    const upload = await testUpload(serverUrl, { size: 1048576, samples: 2 })

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
  }, [collectSample])

  const handleShare = useCallback(() => {
    if (!results) return
    const text = `Transworld Speed Test Results:\n📥 ${results.download?.average?.toFixed(1)} Mbps download\n📤 ${results.upload?.average?.toFixed(1)} Mbps upload\n📶 ${results.ping?.average?.toFixed(0)} ms ping\n\nTested at speedtest-transworld.vercel.app`
    if (navigator.share) {
      navigator.share({ title: 'Transworld Speed Test', text })
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Results copied to clipboard!'))
    }
  }, [results])

  const allIsps = getAllISPs()
  const recs = results?.download?.average ? getRecommendations(results.download.average) : null
  const grade = results?.download?.average ? getSpeedGrade(results.download.average) : null
  const video = results?.download?.average ? getVideoQuality(results.download.average) : null
  const totalDataUsed = results?.download?.totalBytes && results?.upload?.totalBytes
    ? ((results.download.totalBytes + results.upload.totalBytes) / 1048576).toFixed(0) + ' MB'
    : '~12 MB'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-[#0a1628] to-gray-900 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-2xl mx-auto w-full pb-8">
        <div className="w-full flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            {networkInfo?.isp || 'Detecting...'}&nbsp;·&nbsp;{networkInfo?.ip || ''}
            {networkInfo?.city && <>&nbsp;·&nbsp;{networkInfo.city}</>}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedIsp}
              onChange={e => { setSelectedIsp(e.target.value); localStorage.setItem('tw_server_isp', e.target.value) }}
              className="bg-white/5 border border-white/10 rounded-lg text-xs px-2 py-1.5 text-gray-300 outline-none cursor-pointer"
            >
              <option value="">Auto Server</option>
              {allIsps.map(isp => (
                <optgroup key={isp.name} label={isp.name}>
                  {isp.servers.map(s => (
                    <option key={s.id} value={s.id}>{s.city}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div className="relative w-64 h-64 sm:w-72 sm:h-72 mb-2">
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
              {results && !testing && grade && (
                <span className={`text-lg font-bold mt-1 ${grade.color}`}>{grade.grade}</span>
              )}
            </div>
          )}
        </div>

        {speedSamples.length > 1 && (
          <div className="w-full h-20 mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={speedSamples}>
                <XAxis dataKey="t" hide />
                <YAxis hide domain={[0, 'auto']} />
                <Line type="monotone" dataKey="s" stroke="#00B4D8" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {results && (
          <div className="w-full space-y-3 animate-fade-in mt-1">
            <div className="grid grid-cols-4 gap-2">
              <ResultCard label="Ping" value={results.ping?.average?.toFixed(0)} unit="ms" color="text-cyan-400" />
              <ResultCard label="Jitter" value={results.jitter?.average?.toFixed(1)} unit="ms" color="text-purple-400" />
              <ResultCard label="Download" value={results.download?.average?.toFixed(1)} unit="Mbps" color="text-blue-400" />
              <ResultCard label="Upload" value={results.upload?.average?.toFixed(1)} unit="Mbps" color="text-green-400" />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <ResultCard label="Packet Loss" value={results.packetLoss?.lossPercent?.toFixed(1)} unit="%" color={results.packetLoss?.lossPercent > 0 ? 'text-red-400' : 'text-green-400'} />
              <ResultCard label="DNS" value={results.dns?.average?.toFixed(0)} unit="ms" color="text-yellow-400" />
              <ResultCard label="Bufferbloat" value={results.bufferbloat?.bufferbloat?.toFixed(0)} unit="ms" color="text-orange-400" />
              <ResultCard label="Stability" value={results.stability?.score != null ? results.stability.score : '--'} unit="" color={results.stability?.score >= 90 ? 'text-green-400' : results.stability?.score >= 70 ? 'text-yellow-400' : 'text-red-400'} />
            </div>

            {recs && (
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: recs.activity.color }} />
                    <span className="text-xs sm:text-sm text-gray-300">{recs.activity.label}</span>
                  </div>
                  {video && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span>{video.icon}</span>
                      <span className={video.color}>{video.label}</span>
                    </div>
                  )}
                </div>
                {recs.games.games.length > 0 && (
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                    <span>🎮</span>
                    <span>{recs.games.games.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-600 px-1">
              <span>Data used: {totalDataUsed}</span>
              <span>Connection: {networkInfo?.type || networkInfo?.effectiveType || 'Unknown'}</span>
            </div>

            {results.gamingServers && (
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Gaming Servers</div>
                <div className="grid grid-cols-5 gap-1">
                  {Object.entries(results.gamingServers).map(([key, server]) => (
                    <div key={key} className="text-center">
                      <div className="text-[9px] text-gray-500 truncate">{server?.name || key}</div>
                      <div className={`text-xs font-bold ${server?.ping <= 50 ? 'text-green-400' : server?.ping <= 100 ? 'text-yellow-400' : server?.ping <= 200 ? 'text-orange-400' : 'text-red-400'}`}>
                        {server?.ping || '--'}
                        <span className="text-[9px] text-gray-600 ml-0.5">ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.throttling && (
              <div className={`rounded-xl p-2.5 border text-xs ${results.throttling.isThrottled ? 'bg-red-900/20 border-red-500/30 text-red-300' : 'bg-green-900/20 border-green-500/30 text-green-300'}`}>
                {results.throttling.isThrottled
                  ? `Throttling detected: ${results.throttling.actualSpeed} Mbps of ${results.throttling.planSpeed} Mbps plan (${results.throttling.ratio}%)`
                  : `Plan ${results.throttling.planSpeed} Mbps → Actual ${results.throttling.actualSpeed} Mbps`}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button onClick={handleStart} className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-all">
                Test Again
              </button>
              <button onClick={handleShare} className="px-6 py-2.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-sm font-medium text-blue-300 hover:bg-blue-500/30 transition-all">
                Share
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
    <div className="text-center bg-white/[0.03] rounded-xl p-2.5 border border-white/5">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`text-xl font-bold ${color || 'text-white'}`}>
        {value ?? '--'}
        {unit && <span className="text-[10px] text-gray-600 ml-0.5">{unit}</span>}
      </div>
    </div>
  )
}
