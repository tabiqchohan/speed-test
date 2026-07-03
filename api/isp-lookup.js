export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || '0.0.0.0'

  const isp = 'Transworld'
  const city = 'Karachi'

  res.status(200).json({
    ip: clientIp,
    isp,
    city,
    country: 'Pakistan',
    lookupTime: new Date().toISOString(),
  })
}
