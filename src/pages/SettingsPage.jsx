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
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExportPDF = () => {
    const history = JSON.parse(localStorage.getItem('tw_history') || '[]')
    if (history.length === 0) { alert('No data to export.'); return }
    const text = history.map((h, i) =>
      `#${i + 1}: ${new Date(h.date).toLocaleDateString()} - Down: ${(h.download?.average || 0).toFixed(1)} Mbps, Up: ${(h.upload?.average || 0).toFixed(1)} Mbps, Ping: ${(h.ping?.average || 0).toFixed(0)} ms`
    ).join('\n---\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `speed-test-report-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleLang = () => {
    const newLang = i18n.language === 'en' ? 'ur' : 'en'
    i18n.changeLanguage(newLang)
    localStorage.setItem('tw_lang', newLang)
    document.documentElement.dir = newLang === 'ur' ? 'rtl' : 'ltr'
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('settings.title')}</h1>

      <div className="space-y-4">
        <div className="card">
          <h2 className="font-semibold mb-4">{t('settings.language')}</h2>
          <button
            onClick={toggleLang}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            {i18n.language === 'en' ? 'اردو میں تبدیل کریں' : 'Switch to English'}
          </button>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">{t('settings.theme')}</h2>
          <div className="flex gap-3">
            {[
              { key: 'dark', label: t('settings.dark'), icon: '🌙' },
              { key: 'light', label: t('settings.light'), icon: '☀️' },
              { key: 'system', label: t('settings.system'), icon: '💻' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setTheme(opt.key)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                  theme === opt.key
                    ? 'bg-transworld-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">{t('settings.testSize')}</h2>
          <div className="flex gap-3">
            {[
              { key: 'small', label: t('settings.small') },
              { key: 'medium', label: t('settings.medium') },
              { key: 'large', label: t('settings.large') },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setTestSize(opt.key)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                  testSize === opt.key
                    ? 'bg-transworld-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Unit Scale</h2>
          <div className="flex gap-3">
            {[
              { key: 'auto', label: 'Auto' },
              { key: 'Mbps', label: 'Mbps' },
              { key: 'Kbps', label: 'Kbps' },
              { key: 'Gbps', label: 'Gbps' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setUnitPref(opt.key)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                  unitPref === opt.key
                    ? 'bg-transworld-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">{t('settings.server')}</h2>
          <select
            value={selectedIsp}
            onChange={e => setSelectedIsp(e.target.value)}
            className="input w-full"
          >
            <option value="">{t('settings.autoServer')}</option>
            {allIsps.map(isp => (
              <optgroup key={isp.name} label={`${isp.name} (${isp.cities.join(', ')})`}>
                {isp.servers.map(s => (
                  <option key={s.id} value={s.id}>{isp.name} - {s.city}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-2">Select a specific server or leave on Auto for best ping</p>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">{t('throttling.plan')}</h2>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="e.g. 50"
              value={planSpeed}
              onChange={e => setPlanSpeed(e.target.value)}
              className="input flex-1"
            />
            <span className="flex items-center text-gray-500">Mbps</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Enter your plan speed for throttling detection and plan vs actual comparison</p>
        </div>

        <button onClick={handleSave} className="btn-primary w-full">
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>

        <div className="card">
          <h2 className="font-semibold mb-4">{t('tips.title')}</h2>
          <ul className="space-y-2">
            {SPEED_TIPS.slice(0, 6).map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="text-transworld-500 mt-0.5">{i18n.language === 'ur' ? '•' : '•'}</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Export Data</h2>
          <button onClick={handleExportPDF} className="btn-secondary">
            Export History as Text
          </button>
        </div>
      </div>
    </div>
  )
}
