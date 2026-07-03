import { Router } from 'express'

const router = Router()

const stats = {
  totalTests: 0,
  totalDownloads: 0,
  totalUploads: 0,
  totalPings: 0,
  averageDownload: 0,
  averageUpload: 0,
  averagePing: 0,
  serverLoad: 0,
  cityStats: {},
  ispStats: {},
  hourlyTests: Array(24).fill(0),
  startTime: new Date().toISOString(),
}

export function recordTest(type, data) {
  stats.totalTests++
  const hour = new Date().getHours()
  stats.hourlyTests[hour] = (stats.hourlyTests[hour] || 0) + 1

  if (type === 'download') {
    stats.totalDownloads++
    stats.averageDownload = (stats.averageDownload * (stats.totalDownloads - 1) + data.speed) / stats.totalDownloads
    if (data.city) {
      if (!stats.cityStats[data.city]) stats.cityStats[data.city] = { tests: 0, totalSpeed: 0 }
      stats.cityStats[data.city].tests++
      stats.cityStats[data.city].totalSpeed += data.speed
    }
    if (data.isp) {
      if (!stats.ispStats[data.isp]) stats.ispStats[data.isp] = { tests: 0, totalSpeed: 0 }
      stats.ispStats[data.isp].tests++
      stats.ispStats[data.isp].totalSpeed += data.speed
    }
  }

  if (type === 'upload') {
    stats.totalUploads++
    stats.averageUpload = (stats.averageUpload * (stats.totalUploads - 1) + data.speed) / stats.totalUploads
  }

  if (type === 'ping') {
    stats.totalPings++
    stats.averagePing = (stats.averagePing * (stats.totalPings - 1) + data.latency) / stats.totalPings
  }
}

router.get('/stats', (req, res) => {
  const cityAverages = {}
  for (const [city, data] of Object.entries(stats.cityStats)) {
    cityAverages[city] = {
      tests: data.tests,
      avgSpeed: Math.round((data.totalSpeed / data.tests) * 10) / 10,
    }
  }

  const ispAverages = {}
  for (const [isp, data] of Object.entries(stats.ispStats)) {
    ispAverages[isp] = {
      tests: data.tests,
      avgSpeed: Math.round((data.totalSpeed / data.tests) * 10) / 10,
    }
  }

  res.json({
    ...stats,
    cityAverages,
    ispAverages,
    uptime: Math.floor((Date.now() - new Date(stats.startTime).getTime()) / 1000),
  })
})

router.options('/stats', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.end()
})

export default router
