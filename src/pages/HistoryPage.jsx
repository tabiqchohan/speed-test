import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { calcNetworkQuality, isPeakHourPK } from '../../shared/helpers.js'

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('tw_history') || '[]') } catch { return [] }
}

export default function HistoryPage() {
  const [history, setHistory] = useState(loadHistory)
  const [trendFilter, setTrendFilter] = useState('all')

  useEffect(() => {
    const handler = () => setHistory(loadHistory())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const filteredHistory = trendFilter === 'all' ? history : history.filter(h => {
    const d = new Date(h.date)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - (trendFilter === '7d' ? 7 : 30))
    return d >= cutoff
  })

  const chartData = [...filteredHistory].reverse().map(h => ({
    date: new Date(h.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    download: h.download?.average || 0,
    upload: h.upload?.average || 0,
    ping: h.ping?.average || 0,
  }))

  const clearHistory = () => { localStorage.removeItem('tw_history'); setHistory([]) }

  const exportCsv = () => {
    const headers = 'Date,Download (Mbps),Upload (Mbps),Ping (ms)\n'
    const rows = history.map(h =>
      `${h.date},${(h.download?.average || 0).toFixed(1)},${(h.upload?.average || 0).toFixed(1)},${(h.ping?.average || 0).toFixed(0)}`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `speed-history-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4 opacity-40">📊</div>
        <h2 className="text-lg font-bold mb-1 text-white/80">Test History</h2>
        <p className="text-sm text-gray-500">No tests yet. Run your first speed test!</p>
      </div>
    )
  }

  const avg = {
    download: filteredHistory.length ? (filteredHistory.reduce((s, h) => s + (h.download?.average || 0), 0) / filteredHistory.length).toFixed(1) : '0',
    upload: filteredHistory.length ? (filteredHistory.reduce((s, h) => s + (h.upload?.average || 0), 0) / filteredHistory.length).toFixed(1) : '0',
    ping: filteredHistory.length ? (filteredHistory.reduce((s, h) => s + (h.ping?.average || 0), 0) / filteredHistory.length).toFixed(0) : '0',
  }
  const maxDl = filteredHistory.length ? Math.max(...filteredHistory.map(h => h.download?.average || 0)).toFixed(1) : '0'
  const minDl = filteredHistory.length ? Math.min(...filteredHistory.map(h => h.download?.average || 0)).toFixed(1) : '0'

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-white/90">Test History</h1>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:bg-white/10 transition-colors">Export CSV</button>
          <button onClick={clearHistory} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-red-400/70 hover:bg-white/10 transition-colors">Clear</button>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl p-4 border border-white/[0.06] mb-4">
        <div className="flex gap-2 mb-3">
          {[
            { key: '7d', label: '7 Days' },
            { key: '30d', label: '30 Days' },
            { key: 'all', label: 'All Time' },
          ].map(opt => (
            <button key={opt.key} onClick={() => setTrendFilter(opt.key)}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${
                trendFilter === opt.key ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2 text-center mb-3">
          <div><div className="text-[8px] text-gray-600 uppercase tracking-wider">Avg Down</div><div className="text-sm font-bold text-blue-400">{avg.download}</div></div>
          <div><div className="text-[8px] text-gray-600 uppercase tracking-wider">Avg Up</div><div className="text-sm font-bold text-green-400">{avg.upload}</div></div>
          <div><div className="text-[8px] text-gray-600 uppercase tracking-wider">Avg Ping</div><div className="text-sm font-bold text-cyan-400">{avg.ping}</div></div>
          <div><div className="text-[8px] text-gray-600 uppercase tracking-wider">Max Down</div><div className="text-sm font-bold text-purple-400">{maxDl}</div></div>
          <div><div className="text-[8px] text-gray-600 uppercase tracking-wider">Min Down</div><div className="text-sm font-bold text-orange-400">{minDl}</div></div>
        </div>
        {chartData.length > 1 && (
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px' }} />
                <Line type="monotone" dataKey="download" stroke="#0055A5" strokeWidth={2} dot={{ r: 2 }} name="Download" />
                <Line type="monotone" dataKey="upload" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} name="Upload" />
                <Line type="monotone" dataKey="ping" stroke="#22d3ee" strokeWidth={2} dot={{ r: 2 }} name="Ping" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-2.5 px-3 font-medium text-gray-600">Date</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-600">Down</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-600">Up</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-600">Ping</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-600">Loss</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-600">Quality</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => {
                const q = calcNetworkQuality({
                  download: h.download?.average || 0,
                  upload: h.upload?.average || 0,
                  ping: h.ping?.average || 0,
                  jitter: h.jitter?.average || 0,
                  packetLoss: h.packetLoss?.lossPercent || 0,
                  stability: h.stability?.score || 0,
                })
                return (
                  <tr key={h.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 text-gray-400 whitespace-nowrap">{new Date(h.date).toLocaleDateString()} <span className="text-gray-700">{new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
                    <td className="text-right py-2.5 px-3 font-mono font-medium text-blue-400">{h.download?.average?.toFixed(1)}</td>
                    <td className="text-right py-2.5 px-3 font-mono font-medium text-green-400">{h.upload?.average?.toFixed(1)}</td>
                    <td className="text-right py-2.5 px-3 font-mono text-cyan-400">{h.ping?.average?.toFixed(0)}</td>
                    <td className="text-right py-2.5 px-3 font-mono text-gray-500">{h.packetLoss?.lossPercent?.toFixed(1) || '--'}</td>
                    <td className="text-right py-2.5 px-3 font-mono font-medium" style={{ color: q.color }}>{q.score}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
