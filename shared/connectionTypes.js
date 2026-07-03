export const CONNECTION_TYPES = {
  FIBER: {
    id: 'fiber',
    label: 'Fiber',
    labelUr: 'فائبر',
    icon: '🔵',
    minSpeed: 50,
    maxLatency: 30,
  },
  DSL: {
    id: 'dsl',
    label: 'DSL',
    labelUr: 'ڈی ایس ایل',
    icon: '🟤',
    maxSpeed: 50,
    minLatency: 20,
    maxLatency: 80,
  },
  CABLE: {
    id: 'cable',
    label: 'Cable Broadband',
    labelUr: 'کیبل براڈبینڈ',
    icon: '📺',
    maxSpeed: 200,
    maxLatency: 50,
  },
  '4G': {
    id: '4g',
    label: '4G LTE',
    labelUr: '4G',
    icon: '📶',
    maxSpeed: 150,
    minLatency: 30,
    maxLatency: 100,
  },
  '5G': {
    id: '5g',
    label: '5G',
    labelUr: '5G',
    icon: '📶🟢',
    maxSpeed: 1000,
    minLatency: 5,
    maxLatency: 30,
  },
  WIFI: {
    id: 'wifi',
    label: 'WiFi',
    labelUr: 'وائی فائی',
    icon: '📡',
  },
  ETHERNET: {
    id: 'ethernet',
    label: 'Ethernet',
    labelUr: 'ایتھرنیٹ',
    icon: '🔌',
  },
  WIMAX: {
    id: 'wimax',
    label: 'WiMAX',
    labelUr: 'وائی میکس',
    icon: '📡',
  },
  SATELLITE: {
    id: 'satellite',
    label: 'Satellite',
    labelUr: 'سیٹلائٹ',
    icon: '🛰️',
    minLatency: 300,
    maxSpeed: 50,
  },
  UNKNOWN: {
    id: 'unknown',
    label: 'Unknown',
    labelUr: 'نامعلوم',
    icon: '🌐',
  },
}

export function detectConnectionType(info) {
  const { speed, latency, connection } = info

  if (latency >= 300) return CONNECTION_TYPES.SATELLITE

  if (connection && connection.type === 'wifi') return CONNECTION_TYPES.WIFI
  if (connection && connection.type === 'ethernet') return CONNECTION_TYPES.ETHERNET

  if (connection && connection.effectiveType) {
    if (connection.effectiveType === '5g') return CONNECTION_TYPES['5G']
    if (connection.effectiveType === '4g') return CONNECTION_TYPES['4G']
  }

  if (latency <= 30 && speed >= 50) return CONNECTION_TYPES.FIBER
  if (latency <= 80 && speed >= 10) return CONNECTION_TYPES.DSL
  if (latency <= 50 && speed >= 20) return CONNECTION_TYPES.CABLE

  if (latency >= 30 && latency <= 100 && speed <= 150) return CONNECTION_TYPES['4G']
  if (latency >= 5 && latency <= 30 && speed >= 100) return CONNECTION_TYPES['5G']

  return CONNECTION_TYPES.UNKNOWN
}

export function getConnectionEmoji(typeId) {
  const found = Object.values(CONNECTION_TYPES).find(t => t.id === typeId)
  return found ? found.icon : '🌐'
}
