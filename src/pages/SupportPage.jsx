import { useState } from 'react'
import { useTranslation } from 'react-i18next'

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem('tw_history') || '[]')
  } catch { return [] }
}

export default function SupportPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    name: '', phone: '', email: '', connectionType: '', issue: '', planSpeed: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [attachResult, setAttachResult] = useState(true)

  const latestResult = loadHistory()[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const payload = {
      ...form,
      planSpeed: parseFloat(form.planSpeed) || 0,
      testResult: attachResult ? latestResult || null : null,
    }

    try {
      const response = await fetch('/api/complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setSubmitted(true)
        setForm({ name: '', phone: '', email: '', connectionType: '', issue: '', planSpeed: '' })
      } else {
        alert('Submission failed. Please try again.')
      }
    } catch {
      alert('Network error. Please check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">{t('support.title')}</h2>
        <p className="text-gray-500 mb-6">{t('support.success')}</p>
        <button onClick={() => setSubmitted(false)} className="btn-primary">
          {t('support.submit')} Again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{t('support.title')}</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">{t('support.subtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">{t('support.name')}</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={e => updateField('name', e.target.value)}
            className="input"
            placeholder="Muhammad Ali"
          />
        </div>

        <div>
          <label className="label">{t('support.phone')}</label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={e => updateField('phone', e.target.value)}
            className="input"
            placeholder="03XX-XXXXXXX"
          />
        </div>

        <div>
          <label className="label">{t('support.email')}</label>
          <input
            type="email"
            value={form.email}
            onChange={e => updateField('email', e.target.value)}
            className="input"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label className="label">{t('support.connectionType')}</label>
          <select
            value={form.connectionType}
            onChange={e => updateField('connectionType', e.target.value)}
            className="input"
          >
            <option value="">Select type</option>
            <option value="Fiber">Fiber</option>
            <option value="DSL">DSL</option>
            <option value="4G">4G</option>
            <option value="5G">5G</option>
            <option value="WiFi">WiFi</option>
            <option value="Ethernet">Ethernet</option>
          </select>
        </div>

        <div>
          <label className="label">{t('support.planSpeed')}</label>
          <input
            type="number"
            value={form.planSpeed}
            onChange={e => updateField('planSpeed', e.target.value)}
            className="input"
            placeholder="50"
          />
        </div>

        <div>
          <label className="label">{t('support.issue')}</label>
          <textarea
            required
            rows={4}
            value={form.issue}
            onChange={e => updateField('issue', e.target.value)}
            className="input resize-none"
            placeholder="Describe your issue in detail..."
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={attachResult}
            onChange={e => setAttachResult(e.target.checked)}
            className="rounded text-transworld-500 focus:ring-transworld-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('support.attachResult')}
            {latestResult && (
              <span className="text-gray-400 ml-1">
                ({latestResult.download?.average?.toFixed(1) || 0} Mbps)
              </span>
            )}
          </span>
        </label>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Submitting...' : t('support.submit')}
        </button>
      </form>
    </div>
  )
}
