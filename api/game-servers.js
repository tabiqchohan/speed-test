export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  res.status(200).json({
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
}
