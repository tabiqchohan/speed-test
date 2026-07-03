import { Router } from 'express'

const router = Router()

const ISP_IP_RANGES = [
  { range: ['103.0.0.0', '103.255.255.255'], isp: 'PTCL' },
  { range: ['110.0.0.0', '110.255.255.255'], isp: 'Jazz' },
  { range: ['119.0.0.0', '119.255.255.255'], isp: 'Zong' },
  { range: ['175.0.0.0', '175.255.255.255'], isp: 'Transworld' },
  { range: ['182.0.0.0', '182.255.255.255'], isp: 'StormFiber' },
  { range: ['202.0.0.0', '202.255.255.255'], isp: 'Nayatel' },
  { range: ['203.0.0.0', '203.255.255.255'], isp: 'Cybernet' },
  { range: ['210.0.0.0', '210.255.255.255'], isp: 'Wateen' },
  { range: ['39.0.0.0', '39.255.255.255'], isp: 'Telenor' },
  { range: ['45.0.0.0', '45.255.255.255'], isp: 'Ufone' },
]

function ipToNum(ip) {
  return ip.split('.').reduce((acc, oct) => (acc * 256) + parseInt(oct, 10), 0)
}

router.get('/', (req, res) => {
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket.remoteAddress
    || req.ip
    || '0.0.0.0'

  const cleanIp = clientIp.replace('::ffff:', '')
  const ipNum = ipToNum(cleanIp)

  let isp = 'Unknown'
  for (const entry of ISP_IP_RANGES) {
    const start = ipToNum(entry.range[0])
    const end = ipToNum(entry.range[1])
    if (ipNum >= start && ipNum <= end) {
      isp = entry.isp
      break
    }
  }

  res.json({
    ip: cleanIp,
    isp,
    country: 'Pakistan',
    lookupTime: new Date().toISOString(),
  })
})

router.options('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.end()
})

export default router
