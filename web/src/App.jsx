import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import SupportPage from './pages/SupportPage'
import './i18n/index.js'

export default function App() {
  useEffect(() => {
    const savedDir = localStorage.getItem('tw_lang') === 'ur' ? 'rtl' : 'ltr'
    document.documentElement.dir = savedDir
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/support" element={<SupportPage />} />
      </Routes>
    </div>
  )
}
