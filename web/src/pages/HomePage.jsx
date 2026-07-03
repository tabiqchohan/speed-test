import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import SpeedGauge from '../components/SpeedGauge'
import ResultCard from '../components/ResultCard'
import NetworkInfo from '../components/NetworkInfo'
import Recommendations from '../components/Recommendations'
import GamingServers from '../components/GamingServers'
import ThrottlingAlert from '../components/ThrottlingAlert'
import ISPComparison from '../components/ISPComparison'
import ShareButton from '../components/ShareButton'
import ServerSelector from '../components/ServerSelector'
import { runFullTest } from '@shared/speedTest.js'
import { formatSpeed, formatLatency } from '@shared/helpers.js'
import { findServerById } from '@shared/servers.js'

const API_BASE = '/api'
const IS_VERCEL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem('tw_history') || '[]')
  } catch { return [] }
}

function saveHistory(results) {
  const history = loadHistory()
  history.unshift({
    ...results,
    id: Date.now(),
    date: new Date().toISOString(),
  })
  localStorage.setItem('tw_history', JSON.stringify(history.slice(0, 100)))
}

export default function HomePage() {
  const { t } = useTranslation()
  const [testing, setTesting] = useState(false)
  const [progress, setProgress] = useState({ phase: '', percent: 0 })
  const [results, setResults] = useState(null)
  const [selectedServer, setSelectedServer] = useState('auto')
  const [planSpeed, setPlanSpeed] = useState(() => parseInt(localStorage.getItem('tw_plan') || '0'))
  const [testSize, setTestSize] = useState(() => localStorage.getItem('tw_testSize') || 'medium')
  const [networkInfo, setNetworkInfo] = useState(null)

  useEffect(() => {
    fetch(API_BASE + '/isp-lookup')
      .then(r => r.json())
      .then(data => setNetworkInfo(prev => ({ ...prev, ...data })))
      .catch(() => {})

    if ('connection' in navigator) {
      const conn = navigator.connection
      setNetworkInfo(prev => ({
        ...prev,
        type: conn.type || 'unknown',
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
      }))
    }
  }, [])

  const handleStart = useCallback(async () => {
    setTesting(true)
    setResults(null)
    setProgress({ phase: 'starting', percent: 0 })

    let serverUrl = API_BASE
    if (selectedServer !== 'auto') {
      const srv = findServerById(selectedServer)
      if (srv) {
        serverUrl = `http://${srv.host}:${srv.port}`
        setNetworkInfo(prev => ({ ...prev, serverName: `${srv.isp} - ${srv.city}` }))
      }
    }

    try {
      const fullResults = await runFullTest(serverUrl, {
        planSpeed,
        testSize,
        useCDN: IS_VERCEL,
        onProgress: (p) => setProgress({ phase: p.phase, percent: p.percent }),
      })

      setResults(fullResults)
      saveHistory(fullResults)

      if (fullResults.throttling) {
        setPlanSpeed(fullResults.throttling.planSpeed)
      }
    } catch (err) {
      console.error('Test failed:', err)
    } finally {
      setTesting(false)
      setProgress({ phase: '', percent: 0 })
    }
  }, [selectedServer, planSpeed, testSize])

  const phaseLabel = progress.phase
    ? progress.phase.charAt(0).toUpperCase() + progress.phase.slice(1).replace('_', ' ')
    : ''

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('app.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t('app.subtitle')}</p>
      </div>

      <div className="mb-6 max-w-md mx-auto">
        <ServerSelector selected={selectedServer} onSelect={setSelectedServer} />
      </div>

      <div className="max-w-sm mx-auto mb-8">
        <SpeedGauge
          value={results?.download?.average || 0}
          unit={results?.download?.unit || 'Mbps'}
          label={results ? t('result.download') : phaseLabel}
          isTesting={testing}
        />
      </div>

      {!testing && !results && (
        <div className="text-center">
          <button onClick={handleStart} className="btn-primary text-lg px-12 py-4">
            {t('home.start')}
          </button>
        </div>
      )}

      {testing && (
        <div className="text-center">
          <div className="mb-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-md mx-auto">
              <div
                className="h-2 rounded-full bg-transworld-500 transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{phaseLabel} — {Math.round(progress.percent)}%</p>
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ResultCard icon="📥" label={t('result.download')} value={results.download.average.toFixed(1)} unit={results.download.unit} color="text-transworld-500" />
            <ResultCard icon="📤" label={t('result.upload')} value={results.upload.average.toFixed(1)} unit={results.upload.unit} color="text-green-500" />
            <ResultCard icon="📡" label={t('result.ping')} value={results.ping.average.toFixed(0)} unit={results.ping.unit} color="text-orange-500" />
            <ResultCard icon="⚡" label={t('result.jitter')} value={results.jitter.average.toFixed(1)} unit={results.jitter.unit} color="text-purple-500" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {results.packetLoss && (
              <ResultCard icon="📦" label={t('result.packetLoss')} value={results.packetLoss.lossPercent + '%'} unit="" color={results.packetLoss.quality === 'Excellent' ? 'text-green-500' : 'text-red-500'} />
            )}
            {results.bufferbloat && (
              <ResultCard icon="🔄" label={t('result.bufferbloat')} value={results.bufferbloat.grade} unit={`${results.bufferbloat.bufferbloat.toFixed(0)}ms`} />
            )}
            {results.dns && (
              <ResultCard icon="🌐" label={t('result.dns')} value={results.dns.average.toFixed(0)} unit="ms" />
            )}
            {results.stability && (
              <ResultCard icon="📊" label={t('result.stability')} value={results.stability.score} unit="/100" color={results.stability.score >= 70 ? 'text-green-500' : 'text-orange-500'} />
            )}
          </div>

          <Recommendations speedMbps={results.download.average} />
          <NetworkInfo info={networkInfo} />
          {results.gamingServers && <GamingServers results={results.gamingServers} />}
          {results.throttling && <ThrottlingAlert throttling={results.throttling} />}
          <ISPComparison userIsp={networkInfo?.isp} />

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button onClick={handleStart} className="btn-primary">
              {t('home.testAgain')}
            </button>
            <ShareButton
              download={results.download?.average?.toFixed(1)}
              upload={results.upload?.average?.toFixed(1)}
              ping={results.ping?.average?.toFixed(0)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
