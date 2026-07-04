import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SPEED_TIPS } from '../../shared/constants.js'
import { getAllISPs } from '../../shared/servers.js'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const [planSpeed, setPlanSpeed] = useState(() => localStorage.getItem('tw_plan') || '')
  const [testSize, setTestSize] = useState(() => localStorage.getItem('tw_testSize') || 'medium')
  const [theme, setTheme] = useState(() => localStorage.getItem('tw_theme') || 'dark')
  const [unitPref, setUnitPref] = useState(() => localStorage.getItem('tw_unit') || 'auto')
  const [selectedIsp, setSelectedIsp] = useState(() => localStorage.getItem('tw_server_isp') || '')
  const [alertThreshold, setAlertThreshold] = useState(() => localStorage.getItem('tw_alert_threshold') || '')
  const [multiTest, setMultiTest] = useState(() => localStorage.getItem('tw_multi_test') || 'off')
  const [saved, setSaved] = useState(false)

  const allIsps = getAllISPs()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
  }, [theme])

  const handleSave = () => {
    localStorage.setItem('tw_plan', planSpeed)
    localStorage.setItem('tw_testSize', testSize)
    localStorage.setItem('tw_theme', theme)
    localStorage.setItem('tw_unit', unitPref)
    localStorage.setItem('tw_server_isp', selectedIsp)
    localStorage.setItem('tw_alert_threshold', alertThreshold)
    localStorage.setItem('tw_multi_test', multiTest)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExport = () => {
    const history = JSON.parse(localStorage.getItem('tw_history') || '[]')
    if (history.length === 0) { alert('No data.'); return }
    const text = history.map((h, i) =>
      `#${i + 1}: ${new Date(h.date).toLocaleDateString()} - Down: ${(h.download?.average || 0).toFixed(1)} Mbps, Up: ${(h.upload?.average || 0).toFixed(1)} Mbps, Ping: ${(h.ping?.average || 0).toFixed(0)} ms`
    ).join('\n---\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `speed-report-${Date.now()}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  const toggleLang = () => {
    const nl = i18n.language === 'en' ? 'ur' : 'en'
    i18n.changeLanguage(nl)
    localStorage.setItem('tw_lang', nl)
    document.documentElement.dir = nl === 'ur' ? 'rtl' : 'ltr'
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-lg font-bold text-white/90 mb-5">Settings</h1>

      <div className="space-y-3">
        <Section title="Language">
          <button onClick={toggleLang} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors">
            {i18n.language === 'en' ? 'اردو میں تبدیل کریں' : 'Switch to English'}
          </button>
        </Section>

        <Section title="Theme">
          <div className="flex gap-2">
            {[
              { key: 'dark', label: 'Dark', icon: '🌙' },
              { key: 'light', label: 'Light', icon: '☀️' },
              { key: 'system', label: 'System', icon: '💻' },
            ].map(opt => (
              <button key={opt.key} onClick={() => setTheme(opt.key)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  theme === opt.key ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Test File Size">
          <div className="flex gap-2">
            {[
              { key: 'small', label: 'Small (10MB)' },
              { key: 'medium', label: 'Medium (50MB)' },
              { key: 'large', label: 'Large (100MB)' },
            ].map(opt => (
              <button key={opt.key} onClick={() => setTestSize(opt.key)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  testSize === opt.key ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Unit Scale">
          <div className="flex gap-2">
            {['auto', 'Mbps', 'Kbps', 'Gbps'].map(opt => (
              <button key={opt} onClick={() => setUnitPref(opt)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  unitPref === opt ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Server">
          <select value={selectedIsp} onChange={e => setSelectedIsp(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 outline-none"
          >
            <option value="">Auto (Best Ping)</option>
            {allIsps.map(isp => (
              <optgroup key={isp.name} label={`${isp.name} (${isp.cities.join(', ')})`}>
                {isp.servers.map(s => (
                  <option key={s.id} value={s.id}>{isp.name} - {s.city}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </Section>

        <Section title="Plan Speed (for throttling detection)">
          <div className="flex gap-3">
            <input type="number" placeholder="e.g. 50" value={planSpeed}
              onChange={e => setPlanSpeed(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 outline-none"
            />
            <span className="flex items-center text-sm text-gray-500">Mbps</span>
          </div>
          <p className="text-[11px] text-gray-700 mt-1.5">Enter your plan speed to detect throttling</p>
        </Section>

        <Section title="Speed Alert">
          <div className="flex gap-3">
            <input type="number" placeholder="e.g. 20" value={alertThreshold}
              onChange={e => setAlertThreshold(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 outline-none"
            />
            <span className="flex items-center text-sm text-gray-500">Mbps</span>
          </div>
          <p className="text-[11px] text-gray-700 mt-1.5">Alert when speed drops below this threshold (0 = off)</p>
        </Section>

        <Section title="Multi-Test Mode">
          <div className="flex gap-2">
            {[
              { key: 'off', label: 'Off (1 test)' },
              { key: 'on', label: 'On (3 tests, average)' },
            ].map(opt => (
              <button key={opt.key} onClick={() => setMultiTest(opt.key)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  multiTest === opt.key ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-700 mt-1.5">Runs 3 tests and shows average results</p>
        </Section>

        <button onClick={handleSave} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-sm font-medium text-white hover:opacity-90 transition-all">
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>

        <Section title="Speed Tips">
          <ul className="space-y-1.5">
            {SPEED_TIPS.slice(0, 5).map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                <span className="text-blue-400 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Export">
          <button onClick={handleExport} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 hover:bg-white/10 transition-colors">
            Export History as Text
          </button>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl p-4 border border-white/[0.06]">
      <h2 className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  )
}
