import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../i18n/LanguageSwitcher'
import DarkModeToggle from './DarkModeToggle'

export default function Navbar() {
  const { t } = useTranslation()
  const location = useLocation()
  const isHome = location.pathname === '/'

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/history', label: t('nav.history') },
    { to: '/settings', label: t('nav.settings') },
    { to: '/support', label: t('nav.support') },
  ]

  return (
    <nav className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs">
            TW
          </div>
          <span className="font-semibold text-sm hidden sm:block text-white/90">{t('app.title')}</span>
        </Link>

        <div className="hidden sm:flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                location.pathname === link.to
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <DarkModeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  )
}
