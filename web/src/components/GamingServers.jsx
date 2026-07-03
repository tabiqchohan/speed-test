import { useTranslation } from 'react-i18next'

export default function GamingServers({ results }) {
  const { t } = useTranslation()

  if (!results || Object.keys(results).length === 0) return null

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        {t('gaming.title')}
      </h3>
      <div className="space-y-2">
        {Object.values(results).map(s => (
          <div key={s.name} className="flex items-center justify-between py-1.5">
            <span className="text-sm">{s.name}</span>
            <span className="text-sm font-mono">
              {s.grade} {s.ping} ms
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
