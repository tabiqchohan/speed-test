import { Router } from 'express'
import { getSize, generateBytes } from '../utils/fileGenerator.js'
import { downloadLimiter } from '../utils/rateLimiter.js'

const router = Router()

router.get('/', downloadLimiter, (req, res) => {
  const size = getSize(req.query.size || '50mb')
  const fileName = `speedtest_${req.query.size || '50mb'}.bin`

  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-Length': size.toString(),
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers': 'Content-Length',
  })

  for (const chunk of generateBytes(size)) {
    res.write(chunk)
  }

  res.end()
})

router.options('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.end()
})

export default router
