import { useTranslation } from 'react-i18next'
import { detectConnectionType } from '@shared/connectionTypes.js'

export default function NetworkInfo({ info }) {
  const { t } = useTranslation()
  const connType = info ? detectConnectionType(info) : null

  if (!info) return null

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        {t('network.provider')}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-400">{t('network.provider')}</div>
          <div className="font-medium">{info.isp || t('isp.unknown')}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">{t('network.type')}</div>
          <div className="font-medium">{connType?.icon} {connType?.label || 'Unknown'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">{t('network.ip')}</div>
          <div className="font-medium font-mono text-sm">{info.ip || '...'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">{t('network.server')}</div>
          <div className="font-medium">{info.serverName || 'Auto'}</div>
        </div>
        {info.band && (
          <div>
            <div className="text-xs text-gray-400">{t('network.band')}</div>
            <div className="font-medium">{info.band}</div>
          </div>
        )}
        {info.devices && (
          <div>
            <div className="text-xs text-gray-400">{t('network.devices')}</div>
            <div className="font-medium">{info.devices}</div>
          </div>
        )}
      </div>
    </div>
  )
}
