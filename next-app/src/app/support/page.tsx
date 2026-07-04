'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface Complaint {
  id: string
  name: string
  phone: string
  email: string
  connectionType: string
  issue: string
  planSpeed: string
  attachLatest: boolean
  timestamp: string
}

const CONNECTION_TYPES = ['Fiber', 'DSL', 'Cable', 'Wireless', '4G/5G']

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function SupportPage() {
  const { t } = useTranslation()

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    connectionType: 'Fiber',
    issue: '',
    planSpeed: '',
    attachLatest: false,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})
  const [submitted, setSubmitted] = useState(false)

  const validate = () => {
    const errs: typeof errors = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.phone.trim()) errs.phone = 'Phone is required'
    else if (!/^[\d\s+\-()]{7,15}$/.test(form.phone.trim())) errs.phone = 'Invalid phone number'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Invalid email'
    if (!form.issue.trim()) errs.issue = 'Please describe your issue'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    const complaint: Complaint = {
      id: `comp-${Date.now()}`,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      connectionType: form.connectionType,
      issue: form.issue.trim(),
      planSpeed: form.planSpeed,
      attachLatest: form.attachLatest,
      timestamp: new Date().toISOString(),
    }

    const existing = JSON.parse(localStorage.getItem('tw_complaints') || '[]')
    existing.push(complaint)
    localStorage.setItem('tw_complaints', JSON.stringify(existing))

    setSubmitted(true)
    setForm({ name: '', phone: '', email: '', connectionType: 'Fiber', issue: '', planSpeed: '', attachLatest: false })
    setTimeout(() => setSubmitted(false), 5000)
  }

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <motion.div
        className="space-y-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
          <h1 className="text-2xl font-bold">{t('support.title')}</h1>
          <p className="text-gray-400 text-sm mt-1">{t('support.subtitle')}</p>
        </motion.div>

        {submitted && (
          <motion.div
            className="glass-card bg-green-500/10 border-green-500/30 text-green-400 text-center py-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {t('support.success')}
          </motion.div>
        )}

        <motion.div variants={item} className="glass-card space-y-4">
          {/* Full Name */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-1.5 block">{t('support.name')}</label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="John Doe"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-1.5 block">{t('support.phone')}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="+92 300 1234567"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-1.5 block">{t('support.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="john@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Connection Type */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-1.5 block">{t('support.connectionType')}</label>
            <select
              value={form.connectionType}
              onChange={set('connectionType')}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {CONNECTION_TYPES.map((ct) => (
                <option key={ct} value={ct} className="bg-slate-800">{ct}</option>
              ))}
            </select>
          </div>

          {/* Plan Speed */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-1.5 block">Plan Speed (Mbps)</label>
            <input
              type="number"
              value={form.planSpeed}
              onChange={set('planSpeed')}
              placeholder="e.g. 100"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Issue */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-1.5 block">{t('support.issue')}</label>
            <textarea
              rows={4}
              value={form.issue}
              onChange={set('issue')}
              placeholder="Describe your issue in detail..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
            {errors.issue && <p className="text-red-400 text-xs mt-1">{errors.issue}</p>}
          </div>

          {/* Attach Latest Result */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.attachLatest}
              onChange={(e) => setForm((prev) => ({ ...prev, attachLatest: e.target.checked }))}
              className="w-4 h-4 rounded bg-white/5 border-white/10 text-blue-500 focus:ring-blue-500/50"
            />
            <span className="text-sm text-gray-300">Attach Latest Test Result</span>
          </label>

          {/* Submit */}
          <button onClick={handleSubmit} className="btn-primary w-full justify-center">
            {t('support.submit')}
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
