import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import SupportPage from './pages/SupportPage'
import './i18n/index.js'

export default function App() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const savedDir = localStorage.getItem('tw_lang') === 'ur' ? 'rtl' : 'ltr'
    document.documentElement.dir = savedDir
  }, [])

  if (isHome) {
    return (
      <div>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/history" element={<><Navbar /><HistoryPage /></>} />
          <Route path="/settings" element={<><Navbar /><SettingsPage /></>} />
          <Route path="/support" element={<><Navbar /><SupportPage /></>} />
        </Routes>
      </div>
    )
  }

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
