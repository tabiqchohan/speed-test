export const config = {
  maxDuration: 30,
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', () => {
    res.status(200).json({ received: body.length, ok: true })
  })
}
