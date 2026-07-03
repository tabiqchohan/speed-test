import { useTranslation } from 'react-i18next'

export default function ThrottlingAlert({ throttling }) {
  const { t } = useTranslation()

  if (!throttling) return null

  return (
    <div className={`card border-2 ${throttling.isThrottled ? 'border-red-500' : 'border-green-500'}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{throttling.isThrottled ? '⚠️' : '✅'}</span>
        <h3 className="font-semibold">
          {throttling.isThrottled ? t('throttling.detected') : t('throttling.notDetected')}
        </h3>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-gray-400">{t('throttling.plan')}</div>
          <div className="font-medium">{throttling.planSpeed} Mbps</div>
        </div>
        <div>
          <div className="text-gray-400">{t('throttling.actual')}</div>
          <div className="font-medium">{throttling.actualSpeed} Mbps</div>
        </div>
        <div>
          <div className="text-gray-400">{t('throttling.diff')}</div>
          <div className={`font-medium ${throttling.isThrottled ? 'text-red-500' : 'text-green-500'}`}>
            {throttling.ratio}%
          </div>
        </div>
      </div>
    </div>
  )
}
