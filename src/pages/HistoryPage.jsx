import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem('tw_history') || '[]')
  } catch { return [] }
}

export default function HistoryPage() {
  const { t } = useTranslation()
  const [history, setHistory] = useState(loadHistory)

  useEffect(() => {
    const handler = () => setHistory(loadHistory())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const clearHistory = () => {
    localStorage.removeItem('tw_history')
    setHistory([])
  }

  const chartData = [...history].reverse().map(h => ({
    date: new Date(h.date).toLocaleDateString(),
    download: h.download?.average || 0,
    upload: h.upload?.average || 0,
    ping: h.ping?.average || 0,
  }))

  const exportCsv = () => {
    const headers = 'Date,Download (Mbps),Upload (Mbps),Ping (ms),Jitter (ms)\n'
    const rows = history.map(h =>
      `${h.date},${(h.download?.average || 0).toFixed(1)},${(h.upload?.average || 0).toFixed(1)},${(h.ping?.average || 0).toFixed(0)},${(h.jitter?.average || 0).toFixed(1)}`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transworld-speed-history-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-xl font-bold mb-2">{t('history.title')}</h2>
        <p className="text-gray-500">{t('history.empty')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('history.title')}</h1>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn-secondary text-sm py-2 px-4">Export CSV</button>
          <button onClick={clearHistory} className="btn-secondary text-sm py-2 px-4 text-red-500">{t('history.clear')}</button>
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="card mb-6">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
              />
              <Line type="monotone" dataKey="download" stroke="#0055A5" strokeWidth={2} dot={{ r: 3 }} name="Download" />
              <Line type="monotone" dataKey="upload" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Upload" />
              <Line type="monotone" dataKey="ping" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="Ping" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-medium text-gray-500">{t('history.date')}</th>
                <th className="text-right py-3 px-2 font-medium text-gray-500">{t('history.download')}</th>
                <th className="text-right py-3 px-2 font-medium text-gray-500">{t('history.upload')}</th>
                <th className="text-right py-3 px-2 font-medium text-gray-500">{t('history.ping')}</th>
                <th className="text-right py-3 px-2 font-medium text-gray-500">Jitter</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-2">{new Date(h.date).toLocaleDateString()} <span className="text-gray-400">{new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
                  <td className="text-right py-3 px-2 font-mono font-medium text-transworld-500">{h.download?.average?.toFixed(1)}</td>
                  <td className="text-right py-3 px-2 font-mono font-medium text-green-500">{h.upload?.average?.toFixed(1)}</td>
                  <td className="text-right py-3 px-2 font-mono text-orange-500">{h.ping?.average?.toFixed(0)}</td>
                  <td className="text-right py-3 px-2 font-mono text-purple-500">{h.jitter?.average?.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
