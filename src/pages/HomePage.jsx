import { useState, useCallback, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { formatSpeed, calcNetworkQuality, calcConsistency, isPeakHourPK, getWiFiAdvice, getEthernetAdvice, getComparativePercentile, generateResultCard } from '../../shared/helpers.js'
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
const MAX_SPEED = 1000
const CX = 200, CY = 200, R = 155
const ARC_FULL = 2 * Math.PI * R * 0.75
const PHASE_LABELS = {
  ping: 'Ping', jitter: 'Jitter', packet_loss: 'Packet Loss',
  dns: 'DNS', download: 'Download', upload: 'Upload',
  bufferbloat: 'Bufferbloat', stability: 'Stability',
  gaming: 'Gaming Servers', idle: '', complete: 'Complete',
}
const VIDEO_QUALITY = [
  { min: 0, max: 0.5, label: 'Voice Only', color: 'text-red-400', icon: '📞' },
  { min: 0.5, max: 1, label: 'SD Video 360p', color: 'text-orange-400', icon: '📹' },
  { min: 1, max: 2, label: 'HD Video 720p', color: 'text-yellow-400', icon: '🎥' },
  { min: 2, max: 4, label: 'Full HD 1080p', color: 'text-lime-400', icon: '🎥' },
  { min: 4, max: 8, label: '4K / Group HD', color: 'text-green-400', icon: '🎥' },
  { min: 8, max: Infinity, label: 'Multi 4K', color: 'text-cyan-400', icon: '📺' },
]
const GRADES = [
  { min: 200, max: Infinity, grade: 'A+', color: '#a78bfa', label: 'Legendary' },
  { min: 100, max: 200, grade: 'A', color: '#34d399', label: 'Excellent' },
  { min: 50, max: 100, grade: 'B', color: '#60a5fa', label: 'Great' },
  { min: 20, max: 50, grade: 'C', color: '#fbbf24', label: 'Good' },
  { min: 5, max: 20, grade: 'D', color: '#f87171', label: 'Poor' },
  { min: 0, max: 5, grade: 'F', color: '#f87171', label: 'Poor' },
]

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('tw_history') || '[]') } catch { return [] }
}
function saveHistory(r) {
  const h = loadHistory(); h.unshift({ id: Date.now(), date: new Date().toISOString(), ...r })
  localStorage.setItem('tw_history', JSON.stringify(h.slice(0, 100)))
}
function getS(k, d) { try { return localStorage.getItem(k) || d } catch { return d } }
function formatUnit(m, p) {
  if (p === 'Mbps') return { v: m.toFixed(1), u: 'Mbps' }
  if (p === 'Kbps') return { v: (m * 1000).toFixed(0), u: 'Kbps' }
  if (p === 'Gbps') return { v: (m / 1000).toFixed(2), u: 'Gbps' }
  return formatSpeed(m * 1000)
}
function getGrade(m) { return GRADES.find(g => m >= g.min && m < g.max) || GRADES[5] }
function getVideo(m) { return VIDEO_QUALITY.find(q => m >= q.min && m < q.max) || VIDEO_QUALITY[0] }
function getEst(m) {
  if (m <= 0) return []
  return [
    { label: '1GB File', time: (8192 / m).toFixed(1) + 's' },
    { label: '100MB', time: (819.2 / m).toFixed(1) + 's' },
    { label: 'YouTube/hr', time: (1400 / m).toFixed(0) + 'min' },
    { label: 'Netflix 4K/hr', time: (7000 / m).toFixed(0) + 'min' },
  ]
}
function toRad(d) { return d * Math.PI / 180 }
function polar(r, deg) { return { x: CX + r * Math.cos(toRad(deg)), y: CY + r * Math.sin(toRad(deg)) } }

const MAJOR_TICKS = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]

export default function HomePage() {
  const [phase, setPhase] = useState('idle')
  const [liveSpeed, setLiveSpeed] = useState(0)
  const [results, setResults] = useState(null)
  const [networkInfo, setNetworkInfo] = useState(null)
  const [testing, setTesting] = useState(false)
  const [speedSamples, setSpeedSamples] = useState([])
  const [selectedIsp, setSelectedIsp] = useState(() => getS('tw_server_isp', ''))
  const [unitPref] = useState(() => getS('tw_unit', 'auto'))
  const [multiResults, setMultiResults] = useState([])
  const [toastMessage, setToastMessage] = useState('')
  const [toastOpen, setToastOpen] = useState(false)
  const speedRef = useRef(0)
  const animRef = useRef(null)
  const samplesRef = useRef([])
  const lastSampleRef = useRef(0)

  useEffect(() => {
    fetch(API_BASE + '/isp-lookup').then(r => r.json()).then(d => setNetworkInfo(p => ({ ...p, ...d })))
      .catch(() => {
        fetch('https://ip-api.com/json/?fields=status,isp,org,city,country,query')
          .then(r => r.json()).then(d => { if (d.status === 'success') setNetworkInfo(p => ({ ...p, isp: d.isp || d.org, ip: d.query, city: d.city })) }).catch(() => {})
      })
    if ('connection' in navigator) setNetworkInfo(p => ({ ...p, ...navigator.connection }))
  }, [])

  useEffect(() => {
    if (!testing) return
    const a = () => { setLiveSpeed(p => p + (speedRef.current - p) * 0.2); animRef.current = requestAnimationFrame(a) }
    animRef.current = requestAnimationFrame(a)
    return () => cancelAnimationFrame(animRef.current)
  }, [testing])

  const collectSample = useCallback((mbps) => {
    const n = Date.now()
    if (n - lastSampleRef.current < 150) return
    lastSampleRef.current = n
    const next = [...samplesRef.current, { t: n, s: mbps }]
    if (next.length > 200) next.splice(0, next.length - 200)
    samplesRef.current = next; setSpeedSamples(next)
  }, [])

  const handleStart = useCallback(async () => {
    setTesting(true); setResults(null); setLiveSpeed(0); speedRef.current = 0
    samplesRef.current = []; setSpeedSamples([])
    const ps = parseFloat(getS('tw_plan', '0'))
    const sp = (p) => setPhase(p.phase)
    const b = ''

    sp({ phase: 'ping' })
    const ping = await testPing(b, { count: 3 })
    sp({ phase: 'jitter' })
    const jitter = await testJitter(b, { count: 10 })
    sp({ phase: 'packet_loss' })
    const pl = await testPacketLoss(b, { count: 5 })
    sp({ phase: 'dns' })
    const dns = await testDNS()
    sp({ phase: 'download' })
    const dl = await testDownload(b, { size: 5242880, samples: 2, useCDN: IS_VERCEL, onLiveSpeed: (d) => { speedRef.current = d.currentMbps; collectSample(d.currentMbps) } })
    sp({ phase: 'upload' })
    const ul = await testUpload(b, { size: 1048576, samples: 2 })
    sp({ phase: 'bufferbloat' })
    const bb = await testBufferbloat(b)
    sp({ phase: 'stability' })
    const st = await testStability(b, 3000)
    sp({ phase: 'gaming' })
    const gs = await testAllGamingServers()
    let th = null
    if (ps > 0) th = await detectThrottling(b, ps, { samples: 1 })
    sp({ phase: 'complete' })

    const res = { ping, jitter, packetLoss: pl, dns, download: dl, upload: ul, bufferbloat: bb, stability: st, gamingServers: gs, throttling: th, timestamp: new Date().toISOString() }
    speedRef.current = dl?.average || 0

    const multiMode = getS('tw_multi_test', 'off') === 'on'
    if (multiMode) {
      const prev = [...multiResults, res]
      setMultiResults(prev)
      if (prev.length >= 3) {
        const avgDl = prev.reduce((s, r) => s + (r.download?.average || 0), 0) / 3
        const avgUl = prev.reduce((s, r) => s + (r.upload?.average || 0), 0) / 3
        const avgPg = prev.reduce((s, r) => s + (r.ping?.average || 0), 0) / 3
        res.multiAvg = { download: avgDl, upload: avgUl, ping: avgPg }
        setMultiResults([])
      } else {
        setResults(null); setTesting(false); setPhase('idle')
        setTimeout(() => handleStart(), 1000)
        return
      }
    }

    // BEGIN NEW THRESHOLD LOGIC
    const downloadThreshold = parseFloat(getS('tw_download_alert_threshold', '0'));
    const uploadThreshold = parseFloat(getS('tw_upload_alert_threshold', '0'));

    if (downloadThreshold > 0 && dl?.average && dl.average < downloadThreshold) {
      const msg = `Download speed below threshold (${downloadThreshold} Mbps). Current: ${dl.average?.toFixed(1)} Mbps`;
      setToastMessage(msg);
      setToastOpen(true);
    }
    if (uploadThreshold > 0 && ul?.average && ul.average < uploadThreshold) {
      const msg = `Upload speed below threshold (${uploadThreshold} Mbps). Current: ${ul.average?.toFixed(1)} Mbps`;
      setToastMessage(msg);
      setToastOpen(true);
    }
    setTimeout(() => setToastOpen(false), 5000);
    // END NEW THRESHOLD LOGIC

    setTimeout(() => { setResults(res); setTesting(false); setPhase('idle'); saveHistory(res) }, 300)
  }, [collectSample, multiResults])

  const isps = getAllISPs()
  const down = results?.download?.average || 0
  const grade = results ? getGrade(down) : null
  const video = results ? getVideo(down) : null
  const recs = results ? getRecommendations(down) : null
  const ests = results ? getEst(down) : []
  const ct = networkInfo ? detectConnectionType({ speed: down, latency: results?.ping?.average, connection: networkInfo }) : null
  const ia = networkInfo?.isp && ISP_COMPARISON[networkInfo.isp] ? ISP_COMPARISON[networkInfo.isp] : null
  const du = results?.download?.totalBytes && results?.upload?.totalBytes ? ((results.download.totalBytes + results.upload.totalBytes) / 1048576).toFixed(0) + ' MB' : '~12 MB'
  const quality = results ? calcNetworkQuality({
    download: down, upload: results.upload?.average || 0,
    ping: results.ping?.average || 0, jitter: results.jitter?.average || 0,
    packetLoss: results.packetLoss?.lossPercent || 0,
    stability: results.stability?.score || 0,
  }) : null
  const consistency = results && samplesRef.current.length > 3 ? calcConsistency(samplesRef.current.map(s => s.s)) : null
  const peakHr = isPeakHourPK()
  const wifiAdvice = getWiFiAdvice(ct, down, consistency)
  const ethAdvice = getEthernetAdvice(ct, down)
  const compPct = getComparativePercentile(ia, down)

  const handleShare = useCallback((whatsapp) => {
    if (!results) return
    const t = whatsapp
      ? `Transworld Speed Test Results:%0A📥 ${results.download?.average?.toFixed(1)} Mbps download%0A📤 ${results.upload?.average?.toFixed(1)} Mbps upload%0A📶 ${results.ping?.average?.toFixed(0)} ms ping%0A🧠 Quality: ${quality?.score}/100 - ${quality?.label}%0ATested at speedtest-transworld.vercel.app`
      : `Transworld Speed Test:\n📥 ${results.download?.average?.toFixed(1)} Mbps\n📤 ${results.upload?.average?.toFixed(1)} Mbps\n📶 ${results.ping?.average?.toFixed(0)} ms ping`
    if (whatsapp) { window.open(`https://wa.me/?text=${t}`, '_blank'); return }
    if (navigator.share) navigator.share({ title: 'Transworld Speed Test', text: t })
    else navigator.clipboard.writeText(t).then(() => alert('Copied!'))
  }, [results, quality])

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-xl mx-auto w-full py-4">
      {toastOpen && (
        <div className="fixed top-4 right-4 z-50 bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-300 shadow-lg animate-fade-in">
          ⚠️ {toastMessage}
        </div>
      )}
      <div className="w-full flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/[0.08]">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[11px] text-gray-400">{networkInfo?.isp || 'Detecting...'}</span>
          {networkInfo?.ip && <span className="text-[11px] text-gray-600">· {networkInfo.ip}</span>}
          {ct?.icon && <span className="text-[11px]">{ct.icon}</span>}
        </div>
        <select value={selectedIsp} onChange={e => { setSelectedIsp(e.target.value); localStorage.setItem('tw_server_isp', e.target.value) }}
          className="bg-white/5 border border-white/10 rounded-lg text-[11px] px-2 py-1.5 text-gray-400 outline-none cursor-pointer max-w-[130px]">
          <option value="">Auto</option>
          {isps.slice(0, 12).map(isp => (
            <optgroup key={isp.name} label={isp.name}>
              {isp.servers.map(s => <option key={s.id} value={s.id}>{s.city}</option>)}
            </optgroup>
          ))}
          {isps.length > 12 && <option disabled>── {isps.length - 12} more ──</option>}
        </select>
      </div>

      <div className="relative w-[340px] h-[340px] sm:w-[380px] sm:h-[380px] -mt-6">
        <svg className="w-full h-full" viewBox="0 0 400 400">
          <defs>
            <linearGradient id="mg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0055A5" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            <filter id="glow"><feGaussianBlur stdDeviation="2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>

          <path d="M 90.4 90.4 A 155 155 0 1 1 309.6 90.4" fill="none" stroke="#ffffff06" strokeWidth="10" strokeLinecap="round" />
          <path d="M 90.4 90.4 A 155 155 0 1 1 309.6 90.4" fill="none" stroke="url(#mg)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${pct * ARC_FULL} ${ARC_FULL}`} className="transition-all duration-200" />

          {MAJOR_TICKS.map(s => {
            const a = 225 + (s / 1000) * 270
            const o = polar(R - 8, a)
            const i = polar(R - 24, a)
            return <line key={s} x1={o.x} y1={o.y} x2={i.x} y2={i.y} stroke="#ffffff20" strokeWidth="2.5" strokeLinecap="round" />
          })}

          {MAJOR_TICKS.map(s => {
            const a = 225 + (s / 1000) * 270
            const o = polar(R - 8, a)
            const i = polar(R - 24, a)
            return <line key={s} x1={o.x} y1={o.y} x2={i.x} y2={i.y} stroke="#ffffff0d" strokeWidth="1.5" strokeLinecap="round" />
          })}

          {MAJOR_TICKS.map(s => {
            const a = 225 + (s / 1000) * 270
            const p = polar(R - 34, a)
            return (
              <text key={s} x={p.x} y={p.y + 3} textAnchor="middle" className="fill-gray-600" fontSize="11" fontFamily="system-ui">
                {s}
              </text>
            )})}

          <g transform={`rotate(${needleAngle}, ${CX}, ${CY})`} style={{ transition: 'transform 0.12s ease-out', transformOrigin: `${CX}px ${CY}px` }}>
            <line x1={CX} y1={CY} x2={CX} y2={CY - R + 20} stroke="#f87171" strokeWidth="3.5" strokeLinecap="round" filter="url(#glow)" />
            <circle cx={CX} cy={CY} r="7" fill="#1e293b" stroke="#f87171" strokeWidth="2.5" />
            <circle cx={CX} cy={CY} r="2.5" fill="#f87171" />
          </g>

          {(phase !== 'idle' || results) && (
            <>
              <text x={CX} y={CY + 50} textAnchor="middle" className="fill-white" fontSize="32" fontWeight="700" fontFamily="system-ui">
                {d.v}
              </text>
              <text x={CX} y={CY + 70} textAnchor="middle" className="fill-gray-500" fontSize="13" fontFamily="system-ui">
                {d.u}
              </text>
              {grade && !testing && (
                <text x={CX} y={CY + 90} textAnchor="middle" fill={grade.color} fontSize="18" fontWeight="bold" fontFamily="system-ui">
                  {grade.grade}
                </text>
              )}
              {testing && (
                <text x={CX} y={CY + 90} textAnchor="middle" className="fill-gray-600" fontSize="9" fontWeight="600" fontFamily="system-ui" letterSpacing="2">
                  {PHASE_LABELS[phase] || phase}
                </text>
              )}
            </>
          )}
        </svg>

        {phase === 'idle' && !results && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button onClick={handleStart} className="pointer-events-auto w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 shadow-xl shadow-blue-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 font-bold text-3xl tracking-widest text-white">
              GO
            </button>
          </div>
        )}

        {speedSamples.length > 1 && (
          <div className="w-full h-14 -mt-3 mb-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={speedSamples}>
                <XAxis dataKey="t" hide /><YAxis hide domain={[0, 'auto']} />
                <Line type="monotone" dataKey="s" stroke="#22d3ee" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {results && (
          <div className="w-full space-y-2.5 animate-fade-in mt-0.5">
            <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06]">
              <div className="grid grid-cols-4 gap-1.5">
                <Mic label="Ping" v={results.ping?.average?.toFixed(0)} u="ms" c="#22d3ee" />
                <Mic label="Jitter" v={results.jitter?.average?.toFixed(1)} u="ms" c="#a78bfa" />
                <Mic label="Download" v={results.download?.average?.toFixed(1)} u="Mbps" c="#60a5fa" />
                <Mic label="Upload" v={results.upload?.average?.toFixed(1)} u="Mbps" c="#34d399" />
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                <Mic label="P.Loss" v={results.packetLoss?.lossPercent?.toFixed(1)} u="%" c={results.packetLoss?.lossPercent > 0 ? '#f87171' : '#34d399'} />
                <Mic label="DNS" v={results.dns?.average?.toFixed(0)} u="ms" c="#fbbf24" />
                <Mic label="Bufferbloat" v={results.bufferbloat?.bufferbloat?.toFixed(0)} u="ms" c="#fb923c" />
                <Mic label="Stability" v={results.stability?.score ?? '--'} u="" c={results.stability?.score >= 90 ? '#34d399' : results.stability?.score >= 70 ? '#fbbf24' : '#f87171'} />
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
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">🎮 {recs.games.games.join(', ')}</div>
                )}
              </div>
            )}

            {ia && (
              <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06]">
                <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5 font-medium">vs {networkInfo?.isp} Avg</div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-blue-400 font-medium">{results.download?.average?.toFixed(0)}</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-gray-500">{ia.avgDownload} Mbps</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-400 font-medium">{results.upload?.average?.toFixed(0)}</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-gray-500">{ia.avgUpload} Mbps</span>
                  </div>
                  <span className="text-gray-600 text-[10px]">{ia.type}</span>
                </div>
              </div>
            )}

            {results.multiAvg && (
              <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06]">
                <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5 font-medium">Multi-Test Average (3 runs)</div>
                <div className="flex items-center gap-4 text-xs">
                  <div><span className="text-blue-400">{results.multiAvg.download?.toFixed(1)}</span> <span className="text-gray-600">Mbps ↓</span></div>
                  <div><span className="text-green-400">{results.multiAvg.upload?.toFixed(1)}</span> <span className="text-gray-600">Mbps ↑</span></div>
                  <div><span className="text-cyan-400">{results.multiAvg.ping?.toFixed(0)}</span> <span className="text-gray-600">ms</span></div>
                </div>
              </div>
            )}

            {ests.length > 0 && (
              <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06]">
                <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5 font-medium">Download Estimates</div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {ests.map((e, i) => (
                    <div key={i}><div className="text-[9px] text-gray-600">{e.label}</div><div className="text-xs font-medium text-cyan-400">{e.time}</div></div>
                  ))}
                </div>
              </div>
            )}

            {quality && (
              <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Network Quality</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: quality.color }}>{quality.score}/100</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: quality.color + '20', color: quality.color }}>{quality.label}</span>
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${quality.score}%`, backgroundColor: quality.color }} />
                </div>
              </div>
            )}

            {consistency != null && (
              <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Speed Consistency</div>
                  <span className={`text-xs font-bold ${consistency >= 80 ? 'text-green-400' : consistency >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{consistency}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${consistency}%`, backgroundColor: consistency >= 80 ? '#34d399' : consistency >= 50 ? '#fbbf24' : '#f87171' }} />
                </div>
              </div>
            )}

            {wifiAdvice && (
              <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs" style={{ color: wifiAdvice.color }}>
                  <span>{wifiAdvice.icon}</span>
                  <span>{wifiAdvice.msg}</span>
                </div>
              </div>
            )}

            {ethAdvice && (
              <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs" style={{ color: ethAdvice.color }}>
                  <span>{ethAdvice.icon}</span>
                  <span>{ethAdvice.msg}</span>
                </div>
              </div>
            )}

            {peakHr && (
              <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs text-yellow-400">
                  <span>🌙</span>
                  <span>Peak hours (7 PM - 11 PM) — speeds may be slower than usual</span>
                </div>
              </div>
            )}

            {compPct != null && (
              <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <span>📊</span>
                  <span>Your speed is better than <strong className="text-white">{compPct}%</strong> of {networkInfo?.isp || 'ISP'} users</span>
                </div>
              </div>
            )}

            {results.gamingServers && (
              <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06]">
                <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2 font-medium">Gaming Servers</div>
                <div className="grid grid-cols-5 gap-x-2 gap-y-1">
                  {Object.entries(results.gamingServers).map(([k, s]) => (
                    <div key={k} className="text-center">
                      <div className="text-[8px] text-gray-600 truncate">{s?.name || k}</div>
                      <div className={`text-[11px] font-bold ${s?.ping <= 50 ? 'text-green-400' : s?.ping <= 100 ? 'text-yellow-400' : s?.ping <= 200 ? 'text-orange-400' : 'text-red-400'}`}>
                        {s?.ping || '--'}<span className="text-[8px] text-gray-700">ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-1">
              <button onClick={handleStart} className="px-7 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 active:scale-95 transition-all">Test Again</button>
              <button onClick={() => handleShare(false)} className="px-7 py-2.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-sm font-medium text-blue-300 hover:bg-blue-500/25 active:scale-95 transition-all">Share</button>
              <button onClick={() => handleShare(true)} className="px-7 py-2.5 rounded-full bg-green-500/15 border border-green-500/25 text-sm font-medium text-green-300 hover:bg-green-500/25 active:scale-95 transition-all">WhatsApp</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Mic({ label, v, u, c }) {
  return (
    <div className="text-center">
      <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-lg font-bold" style={{ color: c || '#fff' }}>
        {v ?? '--'}{u && <span className="text-[9px] text-gray-700 ml-0.5">{u}</span>}
      </div>
    </div>
  )
}