import { Router } from 'express'
import { uploadLimiter } from '../utils/rateLimiter.js'

const router = Router()

router.post('/', uploadLimiter, (req, res) => {
  const start = Date.now()
  let totalBytes = 0

  req.on('data', (chunk) => {
    totalBytes += chunk.length
  })

  req.on('end', () => {
    const timeMs = Date.now() - start
    const speedMbps = timeMs > 0
      ? ((totalBytes * 8) / (timeMs / 1000)) / 1000000
      : 0

    res.json({
      success: true,
      bytesReceived: totalBytes,
      timeMs,
      speedMbps: Math.round(speedMbps * 100) / 100,
    })
  })

  req.on('error', () => {
    res.status(500).json({ success: false, error: 'Upload failed' })
  })
})

router.options('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.end()
})

export default router
