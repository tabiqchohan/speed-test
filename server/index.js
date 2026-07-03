import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import compression from 'compression'
import downloadRouter from './routes/download.js'
import uploadRouter from './routes/upload.js'
import pingRouter from './routes/ping.js'
import serversRouter from './routes/servers.js'
import ispLookupRouter from './routes/ispLookup.js'
import complaintRouter from './routes/complaint.js'
import adminRouter from './routes/admin.js'
import { apiLimiter } from './utils/rateLimiter.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: '*',
  exposedHeaders: ['Content-Length'],
}))

app.use(compression())
app.use(morgan('dev'))
app.use('/api', apiLimiter)

app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.end()
})

app.use('/api/download', downloadRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/ping', pingRouter)
app.use('/api/servers', serversRouter)
app.use('/api/isp-lookup', ispLookupRouter)
app.use('/api/complaint', complaintRouter)
app.use('/api/admin', adminRouter)

app.get('/api/speed-tips', (req, res) => {
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
  res.json({ tips })
})

app.get('/api/isp-comparison', (req, res) => {
  res.json({
    transworld: { avgDownload: 130, avgUpload: 85, type: 'Fiber' },
    ptcl: { avgDownload: 89, avgUpload: 38, type: 'Fiber/DSL' },
    stormfiber: { avgDownload: 209, avgUpload: 145, type: 'Fiber' },
    nayatel: { avgDownload: 225, avgUpload: 158, type: 'Fiber' },
    jazz: { avgDownload: 77, avgUpload: 12, type: '4G/5G' },
    zong: { avgDownload: 127, avgUpload: 22, type: '4G/5G' },
  })
})

app.get('/api/game-servers', (req, res) => {
  res.json({
    pubg_asia: { name: 'PUBG Asia', host: 'api.pubg.com' },
    valorant_eu: { name: 'Valorant EU', host: 'riot.api.riotgames.com' },
    valorant_asia: { name: 'Valorant Asia', host: 'asia.api.riotgames.com' },
    fortnite: { name: 'Fortnite', host: 'fortnite.com' },
    cod: { name: 'COD', host: 'callofduty.com' },
    minecraft: { name: 'Minecraft', host: 'minecraft.net' },
    gta_online: { name: 'GTA Online', host: 'rockstargames.com' },
    apex: { name: 'Apex Legends', host: 'ea.com' },
    csgo: { name: 'CS:GO', host: 'counter-strike.net' },
    dota2: { name: 'Dota 2', host: 'dota2.com' },
  })
})

app.get('/api/coverage', (req, res) => {
  res.json({
    transworld: {
      cities: ['Karachi', 'Lahore', 'Islamabad'],
      type: 'Fiber',
      areas: {
        Karachi: ['Clifton', 'Defence', 'Gulshan', 'Sadar', 'Nazimabad'],
        Lahore: ['Gulberg', 'Defence', 'Model Town', 'Johar Town'],
        Islamabad: ['F-7', 'F-8', 'G-9', 'Blue Area'],
      },
    },
  })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

app.use('/admin', express.static('admin'))

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Server error' })
})

app.listen(PORT, () => {
  console.log(`\n========================================`)
  console.log(`  Transworld Speed Test Server`)
  console.log(`  Running on: http://localhost:${PORT}`)
  console.log(`  API Base:   http://localhost:${PORT}/api/`)
  console.log(`========================================\n`)
})
