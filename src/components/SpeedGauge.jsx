import { useMemo } from 'react'

export default function SpeedGauge({ value = 0, unit = 'Mbps', label = '', isTesting = false }) {
  const radius = 120
  const circumference = 2 * Math.PI * radius
  const maxValue = unit === 'Gbps' ? 10 : unit === 'Mbps' ? 500 : 1000
  const clampedValue = Math.min(value, maxValue)
  const progress = (clampedValue / maxValue) * circumference
  const displayValue = value.toFixed(1)

  const color = useMemo(() => {
    if (value < 5) return '#ef4444'
    if (value < 20) return '#f97316'
    if (value < 50) return '#eab308'
    if (value < 100) return '#22c55e'
    return '#06b6d4'
  }, [value])

  return (
    <div className="flex flex-col items-center">
      <div className="gauge-container">
        <svg className="gauge-svg" width="280" height="280" viewBox="0 0 280 280">
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-gray-200 dark:text-gray-800"
          />
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>
        <div className="gauge-value">
          <div className="speed-value">{isTesting ? '...' : displayValue}</div>
          <div className="speed-unit">{unit}</div>
          {label && <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">{label}</div>}
        </div>
      </div>
      {isTesting && (
        <div className="mt-4 flex items-center gap-2 text-transworld-500">
          <div className="w-2 h-2 rounded-full bg-transworld-500 animate-pulse" />
          <span className="text-sm font-medium">Testing...</span>
        </div>
      )}
    </div>
  )
}
