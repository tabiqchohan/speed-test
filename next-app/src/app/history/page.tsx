'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface TestResult {
  timestamp: string
  download: number
  upload: number
  ping: number
  packetLoss: number
  qualityScore: number
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function HistoryPage() {
  const { t } = useTranslation()
  const [tests, setTests] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'7d' | '30d' | 'all'>('all')

  useEffect(() => {
    const raw = localStorage.getItem('tw_history')
    if (raw) {
      try {
        const parsed: TestResult[] = JSON.parse(raw)
        setTests(parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
      } catch {
        setTests([])
      }
    }
    setLoading(false)
  }, [])

  const filtered = tests.filter((r) => {
    if (filter === 'all') return true
    const days = filter === '7d' ? 7 : 30
    const cutoff = Date.now() - days * 86400000
    return new Date(r.timestamp).getTime() >= cutoff
  })

  const stats = {
    avgDownload: filtered.length ? filtered.reduce((s, r) => s + r.download, 0) / filtered.length : 0,
    avgUpload: filtered.length ? filtered.reduce((s, r) => s + r.upload, 0) / filtered.length : 0,
    avgPing: filtered.length ? filtered.reduce((s, r) => s + r.ping, 0) / filtered.length : 0,
    maxSpeed: filtered.length ? Math.max(...filtered.map((r) => Math.max(r.download, r.upload))) : 0,
    minSpeed: filtered.length ? Math.min(...filtered.map((r) => Math.min(r.download, r.upload))) : 0,
  }

  const chartData = [...filtered].reverse().map((r) => ({
    date: new Date(r.timestamp).toLocaleDateString(),
    download: parseFloat(r.download.toFixed(2)),
    upload: parseFloat(r.upload.toFixed(2)),
    ping: parseFloat(r.ping.toFixed(1)),
  }))

  const handleClear = () => {
    localStorage.removeItem('tw_history')
    setTests([])
  }

  const handleExportCSV = () => {
    const headers = 'Date,Download (Mbps),Upload (Mbps),Ping (ms),Packet Loss (%),Quality Score'
    const rows = filtered.map((r) =>
      [
        new Date(r.timestamp).toLocaleString(),
        r.download.toFixed(2),
        r.upload.toFixed(2),
        r.ping.toFixed(1),
        r.packetLoss.toFixed(1),
        r.qualityScore,
      ].join(',')
    )
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `speedtest-history-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!tests.length) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <motion.h1 className="text-2xl font-bold mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {t('history.title')}
        </motion.h1>
        <motion.div
          className="glass-card text-center py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-gray-400 text-lg">{t('history.empty')}</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <motion.h1 className="text-2xl font-bold" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {t('history.title')}
      </motion.h1>

      {/* Filter Buttons */}
      <motion.div className="flex gap-2" variants={container} initial="hidden" animate="show">
        {(['7d', '30d', 'all'] as const).map((key) => (
          <motion.button
            key={key}
            variants={item}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === key ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {key === '7d' ? '7 Days' : key === '30d' ? '30 Days' : 'All Time'}
          </motion.button>
        ))}
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-5 gap-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {[
          { label: 'Avg Download', value: `${stats.avgDownload.toFixed(1)} Mbps` },
          { label: 'Avg Upload', value: `${stats.avgUpload.toFixed(1)} Mbps` },
          { label: 'Avg Ping', value: `${stats.avgPing.toFixed(1)} ms` },
          { label: 'Max Speed', value: `${stats.maxSpeed.toFixed(1)} Mbps` },
          { label: 'Min Speed', value: `${stats.minSpeed.toFixed(1)} Mbps` },
        ].map((s) => (
          <motion.div key={s.label} variants={item} className="glass-card text-center">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className="text-lg font-bold text-blue-400">{s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Chart */}
      {chartData.length > 1 && (
        <motion.div
          className="glass-card"
          variants={item}
          initial="hidden"
          animate="show"
        >
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Speed Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Line type="monotone" dataKey="download" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="upload" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ping" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <motion.div
        className="glass-card overflow-x-auto"
        variants={item}
        initial="hidden"
        animate="show"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-white/10">
              <th className="text-left py-2 pr-4">Date</th>
              <th className="text-right px-2">Download</th>
              <th className="text-right px-2">Upload</th>
              <th className="text-right px-2">Ping</th>
              <th className="text-right px-2">Loss</th>
              <th className="text-right pl-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-2 pr-4 text-gray-300 whitespace-nowrap">
                  {new Date(r.timestamp).toLocaleDateString()}
                </td>
                <td className="text-right px-2 text-blue-400">{r.download.toFixed(1)}</td>
                <td className="text-right px-2 text-green-400">{r.upload.toFixed(1)}</td>
                <td className="text-right px-2 text-yellow-400">{r.ping.toFixed(1)}</td>
                <td className="text-right px-2">{r.packetLoss.toFixed(1)}%</td>
                <td className="text-right pl-2 font-semibold">{r.qualityScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Actions */}
      <motion.div className="flex gap-3" variants={item} initial="hidden" animate="show">
        <button onClick={handleExportCSV} className="btn-primary">
          {t('history.export')}
        </button>
        <button onClick={handleClear} className="btn-glass text-red-400 hover:text-red-300">
          {t('history.clear')}
        </button>
      </motion.div>
    </div>
  )
}
