import { useTranslation } from 'react-i18next'
import { ISP_COMPARISON } from '@shared/constants.js'

export default function ISPComparison({ userIsp }) {
  const { t } = useTranslation()
  const entries = Object.entries(ISP_COMPARISON)
  const maxSpeed = Math.max(...entries.map(([, d]) => d.avgDownload))

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        {t('comparison.title')}
      </h3>
      <div className="space-y-3">
        {entries.map(([name, data]) => {
          const pct = (data.avgDownload / maxSpeed) * 100
          const isUser = name.toLowerCase() === (userIsp || '').toLowerCase()
          return (
            <div key={name}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className={isUser ? 'font-bold text-transworld-500' : ''}>
                  {name} {isUser ? '(You)' : ''}
                </span>
                <span className="text-gray-500">{data.avgDownload} Mbps</span>
              </div>
              <div className="bar-container">
                <div
                  className={`bar ${isUser ? 'bg-transworld-500' : ''}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
