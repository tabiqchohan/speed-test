'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'

const navLinks = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/history', labelKey: 'nav.history' },
  { href: '/settings', labelKey: 'nav.settings' },
  { href: '/support', labelKey: 'nav.support' },
]

export default function Navbar() {
  const pathname = usePathname()
  const { t, i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = (localStorage.getItem('tw_theme') as 'dark' | 'light') || 'dark'
    setTheme(saved)
    document.documentElement.className = saved
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('tw_theme', next)
    document.documentElement.className = next
  }

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'ur' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('tw_lang', next)
    document.documentElement.dir = next === 'ur' ? 'rtl' : 'ltr'
  }

  if (!mounted) return null

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/[0.04] border-b border-white/[0.06]">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-xs font-bold text-white shadow-lg shadow-blue-500/25">
            TW
          </div>
        </Link>

        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ href, labelKey }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'text-blue-400 bg-white/[0.06]'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {t(labelKey)}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            {i18n.language === 'en' ? 'EN' : 'اردو'}
          </button>
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}
