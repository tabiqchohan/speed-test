'use client'

import { useEffect } from 'react'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import '@/i18n/index'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const theme = localStorage.getItem('tw_theme') || 'dark'
    document.documentElement.className = theme

    const lang = localStorage.getItem('tw_lang') || 'en'
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr'
  }, [])

  return (
    <>
      <Navbar />
      <main className="pb-20 sm:pb-0">{children}</main>
      <BottomNav />
    </>
  )
}
