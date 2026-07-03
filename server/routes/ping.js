import { Router } from 'express'
import { pingLimiter } from '../utils/rateLimiter.js'

const router = Router()

router.get('/', pingLimiter, (req, res) => {
  res.json({
    timestamp: Date.now(),
    message: 'pong',
    serverTime: new Date().toISOString(),
  })
})

router.options('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.end()
})

export default router
