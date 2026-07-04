import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Transworld Speed Test Pro",
  description: "Pakistan's most advanced speed test",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 text-white antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}

import ClientLayout from "./ClientLayout"
