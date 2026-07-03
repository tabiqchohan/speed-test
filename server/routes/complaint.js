import { Router } from 'express'
import { complaintLimiter } from '../utils/rateLimiter.js'

const router = Router()

const complaints = []

router.post('/', complaintLimiter, (req, res) => {
  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', () => {
    try {
      const data = JSON.parse(body)
      const complaint = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        name: data.name || 'Anonymous',
        phone: data.phone || '',
        email: data.email || '',
        connectionType: data.connectionType || 'Unknown',
        planSpeed: data.planSpeed || 0,
        actualSpeed: data.actualSpeed || 0,
        issue: data.issue || '',
        testResult: data.testResult || null,
        city: data.city || '',
        isp: data.isp || 'Unknown',
        status: 'pending',
        createdAt: new Date().toISOString(),
      }

      complaints.unshift(complaint)

      console.log(`[COMPLAINT] New from ${complaint.name} (${complaint.phone}) - ${complaint.issue}`)

      res.status(201).json({
        success: true,
        message: 'Complaint submitted successfully. Our team will contact you soon.',
        complaintId: complaint.id,
      })
    } catch {
      res.status(400).json({ success: false, error: 'Invalid JSON' })
    }
  })

  req.on('error', () => {
    res.status(500).json({ success: false, error: 'Server error' })
  })
})

router.get('/', (req, res) => {
  res.json({ total: complaints.length, complaints: complaints.slice(0, 50) })
})

router.options('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.end()
})

export default router
