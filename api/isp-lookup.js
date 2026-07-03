import http from 'http'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || ''

  let isp = 'Transworld'
  let city = 'Karachi'
  let org = ''

  if (clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1') {
    try {
      const data = await new Promise((resolve, reject) => {
        http.get(`http://ip-api.com/json/${clientIp}?fields=status,isp,org,city,country`, (res) => {
          let body = ''
          res.on('data', chunk => body += chunk)
          res.on('end', () => {
            try { resolve(JSON.parse(body)) } catch { reject() }
          })
        }).on('error', reject)
      })
      if (data.status === 'success') {
        isp = data.isp || data.org || isp
        city = data.city || city
        org = data.org || ''
      }
    } catch {}
  }

  res.status(200).json({
    ip: clientIp,
    isp,
    org,
    city,
    country: 'Pakistan',
    lookupTime: new Date().toISOString(),
  })
}
