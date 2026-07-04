'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

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
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLang((localStorage.getItem('tw_lang') as 'en' | 'ur') || 'en')
    setTheme((localStorage.getItem('tw_theme') as 'dark' | 'light' | 'system') || 'dark')
    setTestSize((localStorage.getItem('tw_testSize') as 'small' | 'medium' | 'large') || 'medium')
    setUnitScale((localStorage.getItem('tw_unitScale') as 'auto' | 'Mbps' | 'Kbps' | 'Gbps') || 'auto')
    setPlanSpeed(localStorage.getItem('tw_plan') || '')
  }, [])

  const handleSave = () => {
    localStorage.setItem('tw_lang', lang)
    localStorage.setItem('tw_theme', theme)
    localStorage.setItem('tw_testSize', testSize)
    localStorage.setItem('tw_unitScale', unitScale)
    localStorage.setItem('tw_plan', planSpeed)

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
    const raw = localStorage.getItem('tw_history')
    const content = raw || 'No history found.'
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `speedtest-history-export-${Date.now()}.txt`
    a.click()
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

        {/* Actions */}
        <motion.div variants={item} className="flex gap-3">
          <button onClick={handleSave} className="btn-primary">
            {saved ? t('settings.saved') + ' ✓' : t('settings.save')}
          </button>
          <button onClick={handleExportHistory} className="btn-glass">
            Export History
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
