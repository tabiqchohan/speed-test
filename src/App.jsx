import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import SupportPage from './pages/SupportPage'
import './i18n/index.js'

export default function App() {
  useEffect(() => {
    const lang = localStorage.getItem('tw_lang') || 'en'
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr'
    const theme = localStorage.getItem('tw_theme') || 'dark'
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 text-white">
      <Navbar />
      <div className="pb-20 sm:pb-0">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/support" element={<SupportPage />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}
