export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  res.status(200).json({
    transworld: { avgDownload: 130, avgUpload: 85, type: 'Fiber' },
    ptcl: { avgDownload: 89, avgUpload: 38, type: 'Fiber/DSL' },
    stormfiber: { avgDownload: 209, avgUpload: 145, type: 'Fiber' },
    nayatel: { avgDownload: 225, avgUpload: 158, type: 'Fiber' },
    jazz: { avgDownload: 77, avgUpload: 12, type: '4G/5G' },
    zong: { avgDownload: 127, avgUpload: 22, type: '4G/5G' },
  })
}
