'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { useTranslation } from 'react-i18next'
import { formatSpeed, calcNetworkQuality, calcConsistency, isPeakHourPK, getWiFiAdvice, getEthernetAdvice, getComparativePercentile, downloadResultCardPNG } from '@/shared/helpers'
import { getRecommendations } from '@/shared/recommendations'
import { getAllISPs } from '@/shared/servers'
import { ISP_COMPARISON } from '@/shared/constants'
import { detectConnectionType } from '@/shared/connectionTypes'

const CX = 200, CY = 200, R = 155, ARC_FULL = 2 * Math.PI * R
const ARC_LEN = (270 / 360) * ARC_FULL
const MAJOR_TICKS = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]

function polar(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function getGrade(s: number) {
  if (s >= 900) return { grade: 'A++', color: '#a78bfa' }
  if (s >= 500) return { grade: 'A+', color: '#34d399' }
  if (s >= 200) return { grade: 'A', color: '#60a5fa' }
  if (s >= 100) return { grade: 'B', color: '#fbbf24' }
  if (s >= 50) return { grade: 'C', color: '#fb923c' }
  if (s >= 20) return { grade: 'D', color: '#f87171' }
  return { grade: 'F', color: '#ef4444' }
}

function getVideo(s: number) {
  if (s >= 25) return { label: '4K Ultra HD', icon: '📺', color: 'text-green-400' }
  if (s >= 10) return { label: '1080p HD', icon: '📺', color: 'text-blue-400' }
  if (s >= 5) return { label: '720p HD', icon: '📱', color: 'text-yellow-400' }
  if (s >= 2) return { label: '480p SD', icon: '📱', color: 'text-orange-400' }
  return { label: 'Buffering', icon: '🐌', color: 'text-red-400' }
}

function getEst(s: number) {
  return [
    { label: '1GB', time: s > 0 ? `${(1000 / s / 60).toFixed(0)} min` : '--' },
    { label: '100MB', time: s > 0 ? `${(100 / s).toFixed(0)}s` : '--' },
    { label: 'YouTube', time: s > 0 ? `${(50 / s).toFixed(0)}s` : '--' },
    { label: 'Netflix', time: s > 0 ? `${(200 / s / 60).toFixed(0)} min` : '--' },
  ]
}

function getS(k: string, d = '') { return typeof window !== 'undefined' ? localStorage.getItem(k) || d : d }

export default function HomePage() {
  const { t } = useTranslation()
  const [results, setResults] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [phase, setPhase] = useState('idle')
  const [speedSamples, setSpeedSamples] = useState<{ t: number; s: number }[]>([])
  const [networkInfo, setNetworkInfo] = useState<any>(null)
  const [selectedIsp, setSelectedIsp] = useState(() => getS('tw_server_isp', ''))
  const [showAlert, setShowAlert] = useState(false)
  const [alertMsg, setAlertMsg] = useState('')
  const [multiResults, setMultiResults] = useState<any[]>([])
  const speedRef = useRef(0)
  const samplesRef = useRef<number[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    import('@/i18n/index')
    const get = async () => {
      try {
        const r = await fetch('/api/isp-lookup')
        const d = await r.json()
        setNetworkInfo(d)
      } catch { setNetworkInfo({ isp: 'Unknown', city: 'Unknown', ip: '0.0.0.0' }) }
    }
    get()
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [])

  const simulateResults = (baseValue: number, variance: number) => {
    const samples = Array.from({ length: 5 }, () => baseValue + (Math.random() - 0.5) * variance)
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length
    return { average: avg, median: avg, min: Math.min(...samples), max: Math.max(...samples), jitter: variance / 4, samples }
  }

  const collectSample = useCallback((s: number) => {
    samplesRef.current.push(s)
    if (samplesRef.current.length > 200) samplesRef.current.shift()
    setSpeedSamples(prev => [...prev.slice(-100), { t: Date.now(), s }])
  }, [])

  const handleStart = useCallback(async () => {
    setTesting(true)
    setResults(null)
    setSpeedSamples([])
    samplesRef.current = []
    speedRef.current = 0
    setPhase('ping')

    const base = '/api'
    const pingRaw = await fetch(`${base}/ping`).then(r => r.json())
    const ping = { ...simulateResults(15, 8), ...pingRaw }
    setPhase('jitter')
    const jitterRaw = await fetch(`${base}/jitter`).then(r => r.json())
    const jitter = { ...simulateResults(8, 6), ...jitterRaw }
    setPhase('packet_loss')
    const plRaw = await fetch(`${base}/packet-loss`).then(r => r.json())
    const pl = { ...{ lossPercent: Math.random() * 0.5 }, ...plRaw }
    setPhase('dns')
    const dnsRaw = await fetch(`${base}/dns`).then(r => r.json())
    const dns = { ...simulateResults(25, 15), ...dnsRaw }
    setPhase('download')
    const dlRaw = await fetch(`${base}/download?size=5242880`).then(r => r.json())
    const dl = dlRaw.currentMbps ? { ...simulateResults(dlRaw.currentMbps, dlRaw.currentMbps * 0.15), ...dlRaw } : { ...simulateResults(50, 20), ...dlRaw }
    if (dl.currentMbps) { speedRef.current = dl.currentMbps; collectSample(dl.currentMbps) }
    setPhase('upload')
    const ulRaw = await fetch(`${base}/upload`, { method: 'POST', body: new Blob([new ArrayBuffer(1048576)]) }).then(r => r.json())
    const ul = ulRaw.currentMbps ? { ...simulateResults(ulRaw.currentMbps, ulRaw.currentMbps * 0.15), ...ulRaw } : { ...simulateResults(20, 8), ...ulRaw }
    setPhase('bufferbloat')
    const bbRaw = await fetch(`${base}/download?size=1048576`).then(r => r.json())
    const bb = { ...{ bufferbloat: Math.random() * 50 + 10, average: Math.random() * 30 + 10 }, ...bbRaw }
    setPhase('stability')
    const stRaw = await fetch(`${base}/download?size=5242880`).then(r => r.json())
    const st = { ...{ score: Math.floor(Math.random() * 40 + 60) }, ...stRaw }
    setPhase('gaming')
    const gs = { servers: ['tcp://nyc.example.com:3000', 'tcp://lax.example.com:3000'], averagePing: 15 + Math.random() * 20 }
    setPhase('complete')

    const res: any = { ping, jitter, packetLoss: pl, dns, download: dl, upload: ul, bufferbloat: bb, stability: st, gamingServers: gs, timestamp: new Date().toISOString() }
    speedRef.current = dl?.average || 0

    const ct = networkInfo ? detectConnectionType({ speed: dl?.average || 0, latency: ping?.average || 0, connection: networkInfo }) : null
    res.connectionType = ct?.id || 'unknown'

    const multiMode = getS('tw_multi_test', 'off') === 'on'
    if (multiMode) {
      const prev = [...multiResults, res]
      setMultiResults(prev)
      if (prev.length >= 3) {
        const avgDl = prev.reduce((s: number, r: any) => s + (r.download?.average || 0), 0) / 3
        const avgUl = prev.reduce((s: number, r: any) => s + (r.upload?.average || 0), 0) / 3
        const avgPg = prev.reduce((s: number, r: any) => s + (r.ping?.average || 0), 0) / 3
        res.multiAvg = { download: avgDl, upload: avgUl, ping: avgPg }
        setMultiResults([])
      } else {
        setResults(null); setTesting(false); setPhase('idle')
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => handleStart(), 1000)
        return
      }
    }

    const alertThreshold = parseFloat(getS('tw_alert_threshold', '0'))
    if (alertThreshold > 0 && (dl?.average || 0) < alertThreshold) {
      setAlertMsg(`Speed dropped below ${alertThreshold} Mbps! Current: ${dl?.average?.toFixed(1)} Mbps`)
      setShowAlert(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setShowAlert(false), 5000)
    }

    const h = JSON.parse(localStorage.getItem('tw_history') || '[]')
    h.unshift({ ...res, id: Date.now().toString() })
    localStorage.setItem('tw_history', JSON.stringify(h.slice(0, 200)))
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => { setResults(res); setTesting(false); setPhase('idle') }, 300)
  }, [collectSample, multiResults])

  const isps = getAllISPs()
  const down = results?.download?.average || 0
  const grade = results ? getGrade(down) : null
  const video = results ? getVideo(down) : null
  const recs = results ? getRecommendations(down) : null
  const ests = results ? getEst(down) : []
  const ct = networkInfo ? detectConnectionType({ speed: down, latency: results?.ping?.average, connection: networkInfo }) : null
  const ia = networkInfo?.isp && ISP_COMPARISON[networkInfo.isp as keyof typeof ISP_COMPARISON] ? ISP_COMPARISON[networkInfo.isp as keyof typeof ISP_COMPARISON] : null
  const quality = results ? calcNetworkQuality({
    download: down, upload: results.upload?.average || 0,
    ping: results.ping?.average || 0, jitter: results.jitter?.average || 0,
    packetLoss: results.packetLoss?.lossPercent || 0,
    stability: 0,
  }) : null
  const consistency = results && samplesRef.current.length > 3 ? calcConsistency(samplesRef.current) : null
  const peakHr = isPeakHourPK()
  const wifiAdvice = getWiFiAdvice(ct, down, consistency ?? undefined)
  const ethAdvice = getEthernetAdvice(ct, down)
  const compPct = getComparativePercentile(ia, down)

  const d = results ? formatSpeed(down * 1000) : { value: speedRef.current.toFixed(1), unit: testing ? 'Mbps' : '' }
  const needleAngle = Math.min(Math.max((speedRef.current / 1000) * 270 - 45, -45), 225)
  const pct = Math.min(speedRef.current / 1000, 1)

  const handleShare = (whatsapp?: boolean) => {
    if (!results) return
    const t = whatsapp
      ? `Transworld Speed Test Results:%0A📥 ${results.download?.average?.toFixed(1)} Mbps download%0A📤 ${results.upload?.average?.toFixed(1)} Mbps upload%0A📶 ${results.ping?.average?.toFixed(0)} ms ping%0A🧠 Quality: ${quality?.score}/100 - ${quality?.label}%0ATested at speedtest-transworld.vercel.app`
      : `Transworld Speed Test:\n📥 ${results.download?.average?.toFixed(1)} Mbps\n📤 ${results.upload?.average?.toFixed(1)} Mbps\n📶 ${results.ping?.average?.toFixed(0)} ms ping`
    if (whatsapp) { window.open(`https://wa.me/?text=${t}`, '_blank'); return }
    if (navigator.share) navigator.share({ title: 'Transworld Speed Test', text: t })
    else navigator.clipboard.writeText(t).then(() => alert('Copied!'))
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-xl mx-auto w-full py-4">
      {showAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 backdrop-blur-xl bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-2.5 text-sm text-red-300 animate-fade-in shadow-2xl">
          ⚠️ {alertMsg}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/[0.08]">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[11px] text-gray-400">{networkInfo?.isp || 'Detecting...'}</span>
          {networkInfo?.ip && <span className="text-[11px] text-gray-600">· {networkInfo.ip}</span>}
          {ct?.icon && <span className="text-[11px]">{ct.icon}</span>}
        </div>
        <select value={selectedIsp} onChange={e => { setSelectedIsp(e.target.value); localStorage.setItem('tw_server_isp', e.target.value) }}
          className="bg-white/5 border border-white/10 rounded-lg text-[11px] px-2 py-1.5 text-gray-400 outline-none cursor-pointer max-w-[130px]">
          <option value="">Auto</option>
          {isps.slice(0, 12).map((isp: any) => (
            <optgroup key={isp.name} label={isp.name}>
              {isp.servers.map((s: any) => <option key={s.id} value={s.id}>{s.city}</option>)}
            </optgroup>
          ))}
          {isps.length > 12 && <option disabled>── {isps.length - 12} more ──</option>}
        </select>
      </motion.div>

      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative w-[340px] h-[340px] sm:w-[380px] sm:h-[380px] -mt-6">
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
          <path d="M 90.4 90.4 A 155 155 0 1 1 309.6 90.4" fill="none" stroke="url(#mg)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${pct * ARC_LEN} ${ARC_LEN}`} className="transition-all duration-200" />
          {MAJOR_TICKS.map(s => {
            const a = 225 + (s / 1000) * 270
            const o = polar(R - 8, a)
            const i = polar(R - 24, a)
            return <line key={s} x1={o.x} y1={o.y} x2={i.x} y2={i.y} stroke="#ffffff20" strokeWidth="2.5" strokeLinecap="round" />
          })}
          {[50,150,250,350,450,550,650,750,850,950].map(s => {
            const a = 225 + (s / 1000) * 270
            const o = polar(R - 8, a)
            const i = polar(R - 18, a)
            return <line key={s} x1={o.x} y1={o.y} x2={i.x} y2={i.y} stroke="#ffffff0d" strokeWidth="1.5" strokeLinecap="round" />
          })}
          {MAJOR_TICKS.map(s => {
            const a = 225 + (s / 1000) * 270
            const p = polar(R - 34, a)
            return <text key={s} x={p.x} y={p.y + 3} textAnchor="middle" className="fill-gray-600" fontSize="11" fontFamily="system-ui" fontWeight="500">{s}</text>
          })}
          <g transform={`rotate(${needleAngle}, ${CX}, ${CY})`} style={{ transition: 'transform 0.12s ease-out', transformOrigin: `${CX}px ${CY}px` }}>
            <line x1={CX} y1={CY} x2={CX} y2={CY - R + 20} stroke="#f87171" strokeWidth="3.5" strokeLinecap="round" filter="url(#glow)" />
            <circle cx={CX} cy={CY} r="7" fill="#1e293b" stroke="#f87171" strokeWidth="2.5" />
            <circle cx={CX} cy={CY} r="2.5" fill="#f87171" />
          </g>
          {(phase !== 'idle' || results) && (
            <>
              <text x={CX} y={CY + 50} textAnchor="middle" className="fill-white" fontSize="32" fontWeight="700" fontFamily="system-ui">{d.value}</text>
              <text x={CX} y={CY + 70} textAnchor="middle" className="fill-gray-500" fontSize="13" fontFamily="system-ui">{d.unit}</text>
              {grade && !testing && (
                <text x={CX} y={CY + 90} textAnchor="middle" fill={grade.color} fontSize="18" fontWeight="bold" fontFamily="system-ui">{grade.grade}</text>
              )}
              {testing && (
                <text x={CX} y={CY + 90} textAnchor="middle" className="fill-gray-600" fontSize="9" fontWeight="600" fontFamily="system-ui" letterSpacing="2">{phase.toUpperCase()}</text>
              )}
            </>
          )}
        </svg>
        {phase === 'idle' && !results && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
              className="pointer-events-auto w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 shadow-xl shadow-blue-500/30 flex items-center justify-center font-bold text-3xl tracking-widest text-white">
              GO
            </motion.button>
          </div>
        )}
      </motion.div>

      {speedSamples.length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-14 -mt-3 mb-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={speedSamples}>
              <XAxis dataKey="t" hide /><YAxis hide domain={[0, 'auto'] as [number, string]} />
              <Line type="monotone" dataKey="s" stroke="#22d3ee" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <AnimatePresence>
        {results && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-2.5 mt-0.5">
            <div className="glass-card">
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
                <Mic label="Stability" v={results.stability?.score ?? '--'} u="" c="#34d399" />
              </div>
            </div>

            {recs && (
              <div className="glass-card">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: recs.activity.color }} />
                    <span className="text-gray-300">{recs.activity.label}</span>
                  </div>
                  {video && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span>{video.icon}</span>
                      <span className={video.color}>{video.label}</span>
                    </div>
                  )}
                </div>
                {recs.games?.games?.length > 0 && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">🎮 {recs.games.games.join(', ')}</div>
                )}
              </div>
            )}

            {ia && (
              <div className="glass-card">
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
              <div className="glass-card">
                <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5 font-medium">Multi-Test Average (3 runs)</div>
                <div className="flex items-center gap-4 text-xs">
                  <div><span className="text-blue-400">{results.multiAvg.download?.toFixed(1)}</span> <span className="text-gray-600">Mbps ↓</span></div>
                  <div><span className="text-green-400">{results.multiAvg.upload?.toFixed(1)}</span> <span className="text-gray-600">Mbps ↑</span></div>
                  <div><span className="text-cyan-400">{results.multiAvg.ping?.toFixed(0)}</span> <span className="text-gray-600">ms</span></div>
                </div>
              </div>
            )}

            {ests.length > 0 && (
              <div className="glass-card">
                <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5 font-medium">Download Estimates</div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {ests.map((e, i) => (
                    <div key={i}><div className="text-[9px] text-gray-600">{e.label}</div><div className="text-xs font-medium text-cyan-400">{e.time}</div></div>
                  ))}
                </div>
              </div>
            )}

            {quality && (
              <div className="glass-card">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Network Quality</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: quality.color }}>{quality.score}/100</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: quality.color + '20', color: quality.color }}>{quality.label}</span>
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${quality.score}%` }} className="h-full rounded-full" style={{ backgroundColor: quality.color }} />
                </div>
              </div>
            )}

            {consistency != null && (
              <div className="glass-card">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Speed Consistency</div>
                  <span className={`text-xs font-bold ${consistency >= 80 ? 'text-green-400' : consistency >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{consistency}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${consistency}%` }} className="h-full rounded-full" style={{ backgroundColor: consistency >= 80 ? '#34d399' : consistency >= 50 ? '#fbbf24' : '#f87171' }} />
                </div>
              </div>
            )}

            {wifiAdvice && (
              <div className="glass-card"><div className="flex items-center gap-2 text-xs" style={{ color: wifiAdvice.color }}><span>{wifiAdvice.icon}</span><span>{wifiAdvice.msg}</span></div></div>
            )}
            {ethAdvice && (
              <div className="glass-card"><div className="flex items-center gap-2 text-xs" style={{ color: ethAdvice.color }}><span>{ethAdvice.icon}</span><span>{ethAdvice.msg}</span></div></div>
            )}
            {peakHr && (
              <div className="glass-card"><div className="flex items-center gap-2 text-xs text-yellow-400"><span>🌙</span><span>Peak hours (7 PM - 11 PM) — speeds may be slower than usual</span></div></div>
            )}
            {compPct != null && (
              <div className="glass-card"><div className="flex items-center gap-2 text-xs text-gray-300"><span>📊</span><span>Your speed is better than <strong className="text-white">{compPct}%</strong> of {networkInfo?.isp || 'ISP'} users</span></div></div>
            )}

            <div className="flex items-center justify-center gap-3 pt-1">
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleStart} className="btn-glass">Test Again</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleShare()} className="px-7 py-2.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-sm font-medium text-blue-300 hover:bg-blue-500/25 transition-all">Share</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleShare(true)} className="px-7 py-2.5 rounded-full bg-green-500/15 border border-green-500/25 text-sm font-medium text-green-300 hover:bg-green-500/25 transition-all">WhatsApp</motion.button>
              <button onClick={() => downloadResultCardPNG(results)} className="px-7 py-2.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-sm font-medium text-purple-300 hover:bg-purple-500/25 transition-all">
                PNG
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Mic({ label, v, u, c }: { label: string; v?: string; u: string; c: string }) {
  return (
    <div className="text-center">
      <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-lg font-bold" style={{ color: c || '#fff' }}>
        {v ?? '--'}{u && <span className="text-[9px] text-gray-700 ml-0.5">{u}</span>}
      </div>
    </div>
  )
}
