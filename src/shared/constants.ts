export const TEST_FILE_SIZES = {
  SMALL: 10 * 1024 * 1024,
  MEDIUM: 50 * 1024 * 1024,
  LARGE: 100 * 1024 * 1024,
}

export const SAMPLE_COUNT = 5
export const PACKET_LOSS_COUNT = 10
export const JITTER_SAMPLE_COUNT = 20
export const DNS_TIMEOUT = 5000
export const PING_TIMEOUT = 10000
export const DOWNLOAD_TIMEOUT = 30000
export const UPLOAD_TIMEOUT = 30000

export const DEFAULT_FILE_SIZE = TEST_FILE_SIZES.MEDIUM

export const THROTTLING_THRESHOLD = 0.3

export const STABILITY_SAMPLE_INTERVAL = 500

export const BUFFERBLOAT_SAMPLE_COUNT = 5

export const GAME_SERVERS = {
  pubg_asia: { name: 'PUBG Asia', host: 'api.pubg.com', port: 443 },
  valorant_eu: { name: 'Valorant EU', host: 'riot.api.riotgames.com', port: 443 },
  valorant_asia: { name: 'Valorant Asia', host: 'asia.api.riotgames.com', port: 443 },
  fortnite: { name: 'Fortnite', host: 'fortnite.com', port: 443 },
  cod: { name: 'COD', host: 'callofduty.com', port: 443 },
  minecraft: { name: 'Minecraft', host: 'minecraft.net', port: 443 },
  gta_online: { name: 'GTA Online', host: 'rockstargames.com', port: 443 },
  apex: { name: 'Apex Legends', host: 'ea.com', port: 443 },
  csgo: { name: 'CS:GO', host: 'counter-strike.net', port: 443 },
  dota2: { name: 'Dota 2', host: 'dota2.com', port: 443 },
}

export const SPEED_TIPS = [
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

export const ISP_COMPARISON = {
  PTCL: { avgDownload: 89, avgUpload: 38, type: 'Fiber/DSL' },
  Transworld: { avgDownload: 130, avgUpload: 85, type: 'Fiber' },
  StormFiber: { avgDownload: 209, avgUpload: 145, type: 'Fiber' },
  Nayatel: { avgDownload: 225, avgUpload: 158, type: 'Fiber' },
  Jazz: { avgDownload: 77, avgUpload: 12, type: '4G/5G' },
  Zong: { avgDownload: 127, avgUpload: 22, type: '4G/5G' },
  Telenor: { avgDownload: 26, avgUpload: 8, type: '4G' },
  Ufone: { avgDownload: 20, avgUpload: 6, type: '4G' },
}
