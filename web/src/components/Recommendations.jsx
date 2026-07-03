import { useTranslation } from 'react-i18next'
import { getRecommendations } from '@shared/recommendations.js'

export default function Recommendations({ speedMbps }) {
  const { t } = useTranslation()
  const recs = getRecommendations(speedMbps)

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        {t('recommendations.title')}
      </h3>

      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">📺 Streaming</div>
        <div className="flex items-center gap-2">
          <div
            className="h-2 rounded-full flex-1"
            style={{ background: `linear-gradient(to right, #ef4444, ${recs.activity.color})` }}
          />
          <span className="text-sm font-medium">{recs.activity.label}</span>
        </div>
      </div>

      <div>
        <div className="text-xs text-gray-400 mb-1">🎮 Gaming</div>
        {recs.games.games.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {recs.games.games.map(game => (
              <span
                key={game}
                className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                {game}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-gray-500">Not suitable for online gaming</span>
        )}
      </div>
    </div>
  )
}
