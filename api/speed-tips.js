export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const tips = [
    'Router ko open jagah par rakhein, walls aur obstacles se door',
    '2.4GHz ki jagah 5GHz WiFi band use karein agar close ho to',
    'Unused devices ko WiFi se disconnect kar dein',
    'VPN band karein jab speed test kar rahe hon',
    'Browser cache clear karein',
    'Router firmware update karein',
    'Ethernet cable use karein agar possible ho to',
    'ISP ko call karein agar consistently slow ho',
    'Network congestion se bachne ke liye off-peak hours mein test karein',
    'Router restart karein har kuch din mein',
    'DNS change karein (Google 8.8.8.8 ya Cloudflare 1.1.1.1)',
    'Fiber connection mein bent fiber check karein',
  ]

  res.status(200).json({ tips })
}
