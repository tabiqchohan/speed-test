import { useState, useCallback, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { formatSpeed } from '../../shared/helpers.js'
import { getRecommendations } from '../../shared/recommendations.js'
import { getAllISPs } from '../../shared/servers.js'
import { ISP_COMPARISON } from '../../shared/constants.js'
import { detectConnectionType } from '../../shared/connectionTypes.js'
import {
  testPing, testJitter, testPacketLoss, testDNS,
  testDownload, testUpload, testBufferbloat, testStability,
  testAllGamingServers, detectThrottling,
} from '../../shared/speedTest.js'

const API_BASE = '/api'
const IS_VERCEL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
const MAX_GAUGE = 500
const ARC_LEN = 414.8

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

const GRADES = [
  { min: 100, max: Infinity, grade: 'A+', color: '#a78bfa', label: 'Legendary' },
  { min: 50, max: 100, grade: 'A', color: '#34d399', label: 'Excellent' },
  { min: 25, max: 50, grade: 'B', color: '#60a5fa', label: 'Great' },
  { min: 10, max: 25, grade: 'C', color: '#fbbf24', label: 'Good' },
  { min: 5, max: 10, grade: 'D', color: '#fb923c', label: 'Fair' },
  { min: 0, max: 5, grade: 'F', color: '#f87171', label: 'Poor' },
]

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('tw_history') || '[]') } catch { return [] }
}
function saveHistory(results) {
  const h = loadHistory()
  h.unshift({ id: Date.now(), date: new Date().toISOString(), ...results })
  localStorage.setItem('tw_history', JSON.stringify(h.slice(0, 100)))
}
function getS(key, def) {
  try { return localStorage.getItem(key) || def } catch { return def }
}
function formatUnit(mbps, pref) {
  if (pref === 'Mbps') return { value: mbps.toFixed(1), unit: 'Mbps' }
  if (pref === 'Kbps') return { value: (mbps * 1000).toFixed(0), unit: 'Kbps' }
  if (pref === 'Gbps') return { value: (mbps / 1000).toFixed(2), unit: 'Gbps' }
  return formatSpeed(mbps * 1000)
}
function getGrade(mbps) {
  return GRADES.find(g => mbps >= g.min && mbps < g.max) || GRADES[5]
}
function getVideo(mbps) {
  return VIDEO_QUALITY.find(q => mbps >= q.min && mbps < q.max) || VIDEO_QUALITY[0]
}
function getEstimate(mbps) {
  if (mbps <= 0) return []
  const items = [
    { label: '1 GB File', time: (8192 / mbps).toFixed(1) + 's' },
    { label: '100 MB File', time: (819.2 / mbps).toFixed(1) + 's' },
    { label: 'YouTube 1080p/hr', time: (1400 / mbps).toFixed(0) + 'min' },
    { label: 'Netflix 4K/hr', time: (7000 / mbps).toFixed(0) + 'min' },
  ]
  return items
}

export default function HomePage() {
  const [phase, setPhase] = useState('idle')
  const [liveSpeed, setLiveSpeed] = useState(0)
  const [results, setResults] = useState(null)
  const [networkInfo, setNetworkInfo] = useState(null)
  const [testing, setTesting] = useState(false)
  const [speedSamples, setSpeedSamples] = useState([])
  const [selectedIsp, setSelectedIsp] = useState(() => getS('tw_server_isp', ''))
  const [unitPref] = useState(() => getS('tw_unit', 'auto'))
  const speedRef = useRef(0)
  const animRef = useRef(null)
  const samplesRef = useRef([])
  const lastSampleRef = useRef(0)

  const display = formatUnit(liveSpeed, unitPref)
  const progress = Math.min(liveSpeed / MAX_GAUGE, 1)
  const needleAngle = -45 - progress * 90

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
      speedRef.current += (speedRef.current - liveSpeed) * 0.1
      setLiveSpeed(p => p + (speedRef.current - p) * 0.2)
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
    setTesting(true); setResults(null); setLiveSpeed(0); speedRef.current = 0
    samplesRef.current = []; setSpeedSamples([])
    const planSpeed = parseFloat(getS('tw_plan', '0'))
    const sp = (p) => setPhase(p.phase)
    const base = ''

    sp({ phase: 'ping' })
    const ping = await testPing(base, { count: 3 })
    sp({ phase: 'jitter' })
    const jitter = await testJitter(base, { count: 10 })
    sp({ phase: 'packet_loss' })
    const packetLoss = await testPacketLoss(base, { count: 5 })
    sp({ phase: 'dns' })
    const dns = await testDNS()
    sp({ phase: 'download' })
    const download = await testDownload(base, {
      size: 5242880, samples: 2, useCDN: IS_VERCEL,
      onLiveSpeed: (d) => { speedRef.current = d.currentMbps; collectSample(d.currentMbps) },
    })
    sp({ phase: 'upload' })
    const upload = await testUpload(base, { size: 1048576, samples: 2 })
    sp({ phase: 'bufferbloat' })
    const bufferbloat = await testBufferbloat(base)
    sp({ phase: 'stability' })
    const stability = await testStability(base, 3000)
    sp({ phase: 'gaming' })
    const gamingServers = await testAllGamingServers()
    let throttling = null
    if (planSpeed > 0) throttling = await detectThrottling(base, planSpeed, { samples: 1 })
    sp({ phase: 'complete' })

    const res = { ping, jitter, packetLoss, dns, download, upload, bufferbloat, stability, gamingServers, throttling, timestamp: new Date().toISOString() }
    speedRef.current = download?.average || 0
    setTimeout(() => { setResults(res); setTesting(false); setPhase('idle'); saveHistory(res) }, 300)
  }, [collectSample])

  const handleShare = useCallback(() => {
    if (!results) return
    const text = `Transworld Speed Test Results:\n📥 ${results.download?.average?.toFixed(1)} Mbps download\n📤 ${results.upload?.average?.toFixed(1)} Mbps upload\n📶 ${results.ping?.average?.toFixed(0)} ms ping\n🎮 Gaming: ${results.ping?.average?.toFixed(0)} ms`
    if (navigator.share) navigator.share({ title: 'Transworld Speed Test', text })
    else navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'))
  }, [results])

  const allIsps = getAllISPs()
  const downSpeed = results?.download?.average || 0
  const grade = results ? getGrade(downSpeed) : null
  const video = results ? getVideo(downSpeed) : null
  const recs = results ? getRecommendations(downSpeed) : null
  const estimates = results ? getEstimate(downSpeed) : []
  const connType = networkInfo ? detectConnectionType({ speed: downSpeed, latency: results?.ping?.average, connection: networkInfo }) : null
  const ispAvg = networkInfo?.isp && ISP_COMPARISON[networkInfo.isp] ? ISP_COMPARISON[networkInfo.isp] : null
  const dataUsed = results?.download?.totalBytes && results?.upload?.totalBytes
    ? ((results.download.totalBytes + results.upload.totalBytes) / 1048576).toFixed(0) + ' MB'
    : '~12 MB'

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-xl mx-auto w-full py-4">
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[11px] text-gray-400">{networkInfo?.isp || 'Detecting...'}</span>
          {networkInfo?.ip && <span className="text-[11px] text-gray-600">· {networkInfo.ip}</span>}
          {networkInfo?.city && <span className="text-[11px] text-gray-600">· {networkInfo.city}</span>}
          {connType && connType.icon && <span className="text-[11px]">{connType.icon}</span>}
        </div>
        <select
          value={selectedIsp}
          onChange={e => { setSelectedIsp(e.target.value); localStorage.setItem('tw_server_isp', e.target.value) }}
          className="bg-white/5 border border-white/10 rounded-lg text-[11px] px-2 py-1.5 text-gray-400 outline-none cursor-pointer max-w-[140px]"
        >
          <option value="">Auto</option>
          {allIsps.slice(0, 15).map(isp => (
            <optgroup key={isp.name} label={isp.name}>
              {isp.servers.map(s => (
                <option key={s.id} value={s.id}>{s.city}</option>
              ))}
            </optgroup>
          ))}
          {allIsps.length > 15 && <option disabled>── {allIsps.length - 15} more ISPs ──</option>}
        </select>
      </div>

      <div className="relative w-72 h-72 sm:w-80 sm:h-80 -mt-2">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          <path d="M 37.8 37.8 A 88 88 0 1 1 162.2 37.8" fill="none" stroke="#ffffff06" strokeWidth="8" strokeLinecap="round" />
          <path d="M 37.8 37.8 A 88 88 0 1 1 162.2 37.8" fill="none" stroke="url(#meterGrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${progress * ARC_LEN} ${ARC_LEN}`} className="transition-all duration-200" />
          <defs>
            <linearGradient id="meterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0055A5" />
              <stop offset="50%" stopColor="#00B4D8" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>

          <text x="100" y="117" textAnchor="middle" className="fill-white font-bold" fontSize="28" fontFamily="system-ui">
            {display.value}
          </text>
          <text x="100" y="136" textAnchor="middle" className="fill-gray-500" fontSize="12" fontFamily="system-ui">
            {display.unit}
          </text>
          {grade && !testing && (
            <text x="100" y="152" textAnchor="middle" fill={grade.color} fontSize="16" fontWeight="bold" fontFamily="system-ui">
              {grade.grade}
            </text>
          )}
          {testing && (
            <text x="100" y="152" textAnchor="middle" className="fill-gray-600" fontSize="9" fontWeight="600" fontFamily="system-ui" letterSpacing="2">
              {PHASE_LABELS[phase] || phase}
            </text>
          )}

          <g transform={`rotate(${needleAngle >= 0 ? needleAngle : 360 + needleAngle}, 100, 100)`} className="transition-all duration-200" style={{ transformOrigin: '100px 100px' }}>
            <polygon points="100,105 97,30 100,16 103,30" fill="#00B4D8" />
            <circle cx="100" cy="100" r="5" fill="#0a1628" stroke="#22d3ee" strokeWidth="2" />
          </g>
        </svg>

        {phase === 'idle' && !results && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button onClick={handleStart} className="pointer-events-auto w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 shadow-xl shadow-blue-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 font-bold text-2xl tracking-widest text-white">
              GO
            </button>
          </div>
        )}
      </div>

      {speedSamples.length > 1 && (
        <div className="w-full h-16 -mt-2 mb-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={speedSamples}>
              <XAxis dataKey="t" hide />
              <YAxis hide domain={[0, 'auto']} />
              <Line type="monotone" dataKey="s" stroke="#22d3ee" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {results && (
        <div className="w-full space-y-2.5 animate-fade-in mt-0.5">
          <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06]">
            <div className="grid grid-cols-4 gap-1.5">
              <MiniCard label="Ping" value={results.ping?.average?.toFixed(0)} unit="ms" color="#22d3ee" />
              <MiniCard label="Jitter" value={results.jitter?.average?.toFixed(1)} unit="ms" color="#a78bfa" />
              <MiniCard label="Download" value={results.download?.average?.toFixed(1)} unit="Mbps" color="#60a5fa" />
              <MiniCard label="Upload" value={results.upload?.average?.toFixed(1)} unit="Mbps" color="#34d399" />
            </div>
            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              <MiniCard label="Packet Loss" value={results.packetLoss?.lossPercent?.toFixed(1)} unit="%" color={results.packetLoss?.lossPercent > 0 ? '#f87171' : '#34d399'} />
              <MiniCard label="DNS" value={results.dns?.average?.toFixed(0)} unit="ms" color="#fbbf24" />
              <MiniCard label="Bufferbloat" value={results.bufferbloat?.bufferbloat?.toFixed(0)} unit="ms" color="#fb923c" />
              <MiniCard label="Stability" value={results.stability?.score ?? '--'} unit="" color={results.stability?.score >= 90 ? '#34d399' : results.stability?.score >= 70 ? '#fbbf24' : '#f87171'} />
            </div>
          </div>

          {recs && (
            <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06]">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: recs.activity.color }} />
                  <span className="text-gray-300">{recs.activity.label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span>{video.icon}</span>
                  <span className={video.color}>{video.label}</span>
                </div>
              </div>
              {recs.games.games.length > 0 && (
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span>🎮</span>
                  <span>{recs.games.games.join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {ispAvg && (
            <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06]">
              <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5 font-medium">vs {networkInfo?.isp} Average</div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-400 font-medium">{results.download?.average?.toFixed(0)}</span>
                  <span className="text-gray-600">/</span>
                  <span className="text-gray-500">{ispAvg.avgDownload} Mbps</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-green-400 font-medium">{results.upload?.average?.toFixed(0)}</span>
                  <span className="text-gray-600">/</span>
                  <span className="text-gray-500">{ispAvg.avgUpload} Mbps</span>
                </div>
                <span className="text-gray-600 text-[10px]">{ispAvg.type}</span>
              </div>
            </div>
          )}

          {estimates.length > 0 && (
            <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06]">
              <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5 font-medium">Download Estimates</div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {estimates.map((e, i) => (
                  <div key={i}>
                    <div className="text-[9px] text-gray-600">{e.label}</div>
                    <div className="text-xs font-medium text-cyan-400">{e.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.gamingServers && (
            <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06]">
              <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2 font-medium">Gaming Servers</div>
              <div className="grid grid-cols-5 gap-x-2 gap-y-1">
                {Object.entries(results.gamingServers).map(([key, s]) => (
                  <div key={key} className="text-center">
                    <div className="text-[8px] text-gray-600 truncate">{s?.name || key}</div>
                    <div className={`text-[11px] font-bold ${s?.ping <= 50 ? 'text-green-400' : s?.ping <= 100 ? 'text-yellow-400' : s?.ping <= 200 ? 'text-orange-400' : 'text-red-400'}`}>
                      {s?.ping || '--'}<span className="text-[8px] text-gray-700">ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-gray-700 px-0.5">
            <span>Data: {dataUsed}</span>
            <span>Connection: {connType?.label || networkInfo?.effectiveType || 'Unknown'}</span>
            <span>Server: {networkInfo?.isp || 'Auto'}</span>
          </div>

          <div className="flex items-center justify-center gap-3 pt-1">
            <button onClick={handleStart} className="px-7 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 active:scale-95 transition-all">
              Test Again
            </button>
            <button onClick={handleShare} className="px-7 py-2.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-sm font-medium text-blue-300 hover:bg-blue-500/25 active:scale-95 transition-all">
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniCard({ label, value, unit, color }) {
  return (
    <div className="text-center">
      <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-lg font-bold" style={{ color: color || '#fff' }}>
        {value ?? '--'}
        {unit && <span className="text-[9px] text-gray-700 ml-0.5">{unit}</span>}
      </div>
    </div>
  )
}
