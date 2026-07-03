import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../i18n/LanguageSwitcher'
import DarkModeToggle from './DarkModeToggle'

export default function Navbar() {
  const { t } = useTranslation()
  const location = useLocation()

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/history', label: t('nav.history') },
    { to: '/settings', label: t('nav.settings') },
    { to: '/support', label: t('nav.support') },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-transworld-500 flex items-center justify-center text-white font-bold text-sm">
            TW
          </div>
          <span className="font-bold text-lg hidden sm:block">{t('app.title')}</span>
        </Link>

        <div className="hidden sm:flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'bg-transworld-50 dark:bg-transworld-900/30 text-transworld-600 dark:text-transworld-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
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

      <div className="sm:hidden flex px-4 pb-2 gap-1 overflow-x-auto">
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              location.pathname === link.to
                ? 'bg-transworld-50 dark:bg-transworld-900/30 text-transworld-600 dark:text-transworld-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
