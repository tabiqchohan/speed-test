'use client'
import { useState, useEffect } from 'react'
import { ssrSafeGet, ssrSafeSet, ssrSafeParseJSON, ssrSafeRemove } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { getAllISPs } from '@/shared/servers'

const SPEED_TIPS = [
  'Use a wired Ethernet connection for the most accurate results',
  'Close other applications and browser tabs during the test',
  'Ensure no other devices are streaming or downloading',
  'Place your WiFi router in a central, open location',
  'Restart your modem and router monthly for optimal performance',
  'Consider upgrading to a fiber connection for better speeds',
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation()

  const [lang, setLang] = useState<'en' | 'ur'>('en')
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark')
  const [testSize, setTestSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [unitScale, setUnitScale] = useState<'auto' | 'Mbps' | 'Kbps' | 'Gbps'>('auto')
  const [planSpeed, setPlanSpeed] = useState('')
  const [alertThreshold, setAlertThreshold] = useState('')
  const [multiTest, setMultiTest] = useState<'off' | 'on'>('off')
  const [selectedIsp, setSelectedIsp] = useState('')
  const [networkFilter, setNetworkFilter] = useState('all')
  const allIsps = getAllISPs()
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLang(ssrSafeGet('tw_lang', 'en') as 'en' | 'ur')
    setTheme(ssrSafeGet('tw_theme', 'dark') as 'dark' | 'light' | 'system')
    setTestSize(ssrSafeGet('tw_testSize', 'medium') as 'small' | 'medium' | 'large')
    setUnitScale(ssrSafeGet('tw_unitScale', 'auto') as 'auto' | 'Mbps' | 'Kbps' | 'Gbps')
    setPlanSpeed(ssrSafeGet('tw_plan'))
    setAlertThreshold(ssrSafeGet('tw_alert_threshold'))
    setMultiTest(ssrSafeGet('tw_multi_test', 'off') as 'off' | 'on')
    setSelectedIsp(ssrSafeGet('tw_server_isp'))
    setNetworkFilter(ssrSafeGet('tw_network_filter', 'all'))
  }, [])

  const handleSave = () => {
    ssrSafeSet('tw_lang', lang)
    ssrSafeSet('tw_theme', theme)
    ssrSafeSet('tw_testSize', testSize)
    ssrSafeSet('tw_unitScale', unitScale)
    ssrSafeSet('tw_plan', planSpeed)
    ssrSafeSet('tw_alert_threshold', alertThreshold)
    ssrSafeSet('tw_multi_test', multiTest)
    ssrSafeSet('tw_server_isp', selectedIsp)
    ssrSafeSet('tw_network_filter', networkFilter)

    i18n.changeLanguage(lang)
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr'

    const resolvedTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme
    document.documentElement.className = resolvedTheme

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExportHistory = () => {
    const raw = ssrSafeGet('tw_history')
    const content = raw || 'No history found.'
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `speedtest-history-export-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    const history = ssrSafeParseJSON('tw_history', [] as any[])
    if (history.length === 0) { alert('No data.'); return }
    const avgDown = (history.reduce((s: number, h: any) => s + (h.download?.average || 0), 0) / history.length).toFixed(1)
    const avgUp = (history.reduce((s: number, h: any) => s + (h.upload?.average || 0), 0) / history.length).toFixed(1)
    const avgPing = (history.reduce((s: number, h: any) => s + (h.ping?.average || 0), 0) / history.length).toFixed(0)

    const html = `<!DOCTYPE html>
<html><head><title>Speed Test Report</title>
<style>body{font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:40px;max-width:800px;margin:auto}
h1{color:#22d3ee;border-bottom:2px solid #22d3ee;padding-bottom:10px}
table{width:100%;border-collapse:collapse;margin-top:20px}
th,td{padding:10px;text-align:left;border-bottom:1px solid #334155}
th{color:#94a3b8;font-size:12px;text-transform:uppercase}
td{font-family:monospace}
.download{color:#60a5fa}.upload{color:#34d399}.ping{color:#22d3ee}</style></head><body>
<h1>Transworld Speed Test Report</h1>
<p>Generated: ${new Date().toLocaleDateString()} | Tests: ${history.length}</p>
<h2>Averages</h2>
<p>Download: <strong class="download">${avgDown} Mbps</strong> | Upload: <strong class="upload">${avgUp} Mbps</strong> | Ping: <strong class="ping">${avgPing} ms</strong></p>
<h2>Test History</h2>
<table><tr><th>Date</th><th>Download</th><th>Upload</th><th>Ping</th></tr>
${history.map((h: any) => `<tr><td>${new Date(h.timestamp || h.date).toLocaleDateString()}</td>
<td class="download">${(h.download?.average || 0).toFixed(1)}</td>
<td class="upload">${(h.upload?.average || 0).toFixed(1)}</td>
<td class="ping">${(h.ping?.average || 0).toFixed(0)}</td></tr>`).join('')}
</table></body></html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `speed-report-${Date.now()}.html`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5">
      <motion.h1
        className="text-2xl font-bold"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {t('settings.title')}
      </motion.h1>

      <motion.div className="space-y-5" variants={container} initial="hidden" animate="show">
        {/* Language */}
        <motion.div variants={item} className="glass-card">
          <label className="text-sm font-semibold text-gray-300 mb-3 block">{t('settings.language')}</label>
          <div className="flex gap-2">
            {(['en', 'ur'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  lang === l ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {l === 'en' ? 'English' : 'اردو'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Theme */}
        <motion.div variants={item} className="glass-card">
          <label className="text-sm font-semibold text-gray-300 mb-3 block">{t('settings.theme')}</label>
          <div className="flex gap-2">
            {(['dark', 'light', 'system'] as const).map((th) => (
              <button
                key={th}
                onClick={() => setTheme(th)}
                className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                  theme === th ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {t(`settings.${th}`)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Test File Size */}
        <motion.div variants={item} className="glass-card">
          <label className="text-sm font-semibold text-gray-300 mb-3 block">{t('settings.testSize')}</label>
          <div className="flex gap-2">
            {(['small', 'medium', 'large'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setTestSize(s)}
                className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                  testSize === s ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {s === 'small' ? 'Small (10MB)' : s === 'medium' ? 'Medium (50MB)' : 'Large (100MB)'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Unit Scale */}
        <motion.div variants={item} className="glass-card">
          <label className="text-sm font-semibold text-gray-300 mb-3 block">Unit Scale</label>
          <div className="flex gap-2">
            {(['auto', 'Mbps', 'Kbps', 'Gbps'] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnitScale(u)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  unitScale === u ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Plan Speed */}
        <motion.div variants={item} className="glass-card">
          <label className="text-sm font-semibold text-gray-300 mb-3 block">Plan Speed (Mbps)</label>
          <input
            type="number"
            value={planSpeed}
            onChange={(e) => setPlanSpeed(e.target.value)}
            placeholder="e.g. 100"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </motion.div>

        {/* Speed Alert */}
        <motion.div variants={item} className="glass-card">
          <label className="text-sm font-semibold text-gray-300 mb-3 block">Speed Alert</label>
          <div className="flex gap-3">
            <input type="number" placeholder="e.g. 20" value={alertThreshold}
              onChange={e => setAlertThreshold(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 outline-none"
            />
            <span className="flex items-center text-sm text-gray-500">Mbps</span>
          </div>
          <p className="text-[11px] text-gray-700 mt-1.5">Alert when speed drops below this threshold (0 = off)</p>
        </motion.div>

        {/* Multi-Test Mode */}
        <motion.div variants={item} className="glass-card">
          <label className="text-sm font-semibold text-gray-300 mb-3 block">Multi-Test Mode</label>
          <div className="flex gap-2">
            {[
              { key: 'off', label: 'Off (1 test)' },
              { key: 'on', label: 'On (3 tests, average)' },
            ].map(opt => (
              <button key={opt.key} onClick={() => setMultiTest(opt.key as 'off' | 'on')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  multiTest === opt.key ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Server Selection */}
        <motion.div variants={item} className="glass-card">
          <label className="text-sm font-semibold text-gray-300 mb-3 block">Server</label>
          <select value={selectedIsp} onChange={e => setSelectedIsp(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 outline-none"
          >
            <option value="">Auto (Best Ping)</option>
            {allIsps.map((isp: any) => (
              <optgroup key={isp.name} label={`${isp.name} (${isp.cities?.join(', ')})`}>
                {isp.servers.map((s: any) => (
                  <option key={s.id} value={s.id}>{isp.name} - {s.city}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </motion.div>

        {/* Network Type */}
        <motion.div variants={item} className="glass-card">
          <label className="text-sm font-semibold text-gray-300 mb-3 block">Network Type</label>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All', icon: '📶' },
              { key: 'wifi', label: 'WiFi', icon: '📡' },
              { key: 'mobile', label: 'Mobile', icon: '📱' },
            ].map(opt => (
              <button key={opt.key} onClick={() => setNetworkFilter(opt.key)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  networkFilter === opt.key ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-700 mt-1.5">Filter history by connection type</p>
        </motion.div>

        {/* Export */}
        <motion.div variants={item} className="glass-card">
          <label className="text-sm font-semibold text-gray-300 mb-3 block">Export</label>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExportHistory} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 hover:bg-white/10 transition-colors">
              Export History as Text
            </button>
            <button onClick={handleExportPDF} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 hover:bg-white/10 transition-colors">
              Download PDF Report
            </button>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div variants={item} className="flex gap-3">
          <button onClick={handleSave} className="btn-primary">
            {saved ? t('settings.saved') + ' ✓' : t('settings.save')}
          </button>
        </motion.div>

        {/* Speed Tips */}
        <motion.div variants={item} className="glass-card">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Speed Tips</h2>
          <ul className="space-y-2">
            {SPEED_TIPS.slice(0, 5).map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </div>
  )
}
