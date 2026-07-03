import { Router } from 'express'

const router = Router()

const PAKISTAN_SERVER_DATA = [
  { id: 'ptcl-khi', isp: 'PTCL', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'ptcl-lhe', isp: 'PTCL', city: 'Lahore', host: 'localhost', port: 3001 },
  { id: 'ptcl-isb', isp: 'PTCL', city: 'Islamabad', host: 'localhost', port: 3001 },
  { id: 'ptcl-pew', isp: 'PTCL', city: 'Peshawar', host: 'localhost', port: 3001 },
  { id: 'ptcl-qta', isp: 'PTCL', city: 'Quetta', host: 'localhost', port: 3001 },
  { id: 'ptcl-mux', isp: 'PTCL', city: 'Multan', host: 'localhost', port: 3001 },
  { id: 'ptcl-fsd', isp: 'PTCL', city: 'Faisalabad', host: 'localhost', port: 3001 },
  { id: 'ptcl-rwp', isp: 'PTCL', city: 'Rawalpindi', host: 'localhost', port: 3001 },
  { id: 'ptcl-hyd', isp: 'PTCL', city: 'Hyderabad', host: 'localhost', port: 3001 },
  { id: 'ptcl-skt', isp: 'PTCL', city: 'Sialkot', host: 'localhost', port: 3001 },
  { id: 'ptcl-guj', isp: 'PTCL', city: 'Gujranwala', host: 'localhost', port: 3001 },
  { id: 'tw1-khi', isp: 'Transworld', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'tw1-lhe', isp: 'Transworld', city: 'Lahore', host: 'localhost', port: 3001 },
  { id: 'tw1-isb', isp: 'Transworld', city: 'Islamabad', host: 'localhost', port: 3001 },
  { id: 'storm-khi', isp: 'StormFiber', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'storm-lhe', isp: 'StormFiber', city: 'Lahore', host: 'localhost', port: 3001 },
  { id: 'storm-isb', isp: 'StormFiber', city: 'Islamabad', host: 'localhost', port: 3001 },
  { id: 'storm-fsd', isp: 'StormFiber', city: 'Faisalabad', host: 'localhost', port: 3001 },
  { id: 'cyber-khi', isp: 'Cybernet', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'cyber-lhe', isp: 'Cybernet', city: 'Lahore', host: 'localhost', port: 3001 },
  { id: 'cyber-isb', isp: 'Cybernet', city: 'Islamabad', host: 'localhost', port: 3001 },
  { id: 'naya-isb', isp: 'Nayatel', city: 'Islamabad', host: 'localhost', port: 3001 },
  { id: 'naya-rwp', isp: 'Nayatel', city: 'Rawalpindi', host: 'localhost', port: 3001 },
  { id: 'naya-lhe', isp: 'Nayatel', city: 'Lahore', host: 'localhost', port: 3001 },
  { id: 'naya-fsd', isp: 'Nayatel', city: 'Faisalabad', host: 'localhost', port: 3001 },
  { id: 'naya-pew', isp: 'Nayatel', city: 'Peshawar', host: 'localhost', port: 3001 },
  { id: 'optix-khi', isp: 'Optix', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'optix-lhe', isp: 'Optix', city: 'Lahore', host: 'localhost', port: 3001 },
  { id: 'fiberlink-khi', isp: 'Fiberlink', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'fiberlink-lhe', isp: 'Fiberlink', city: 'Lahore', host: 'localhost', port: 3001 },
  { id: 'fiberlink-hyd', isp: 'Fiberlink', city: 'Hyderabad', host: 'localhost', port: 3001 },
  { id: 'connect-khi', isp: 'Connect Communication', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'connect-hyd', isp: 'Connect Communication', city: 'Hyderabad', host: 'localhost', port: 3001 },
  { id: 'wateen-lhe', isp: 'Wateen', city: 'Lahore', host: 'localhost', port: 3001 },
  { id: 'wateen-khi', isp: 'Wateen', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'wateen-isb', isp: 'Wateen', city: 'Islamabad', host: 'localhost', port: 3001 },
  { id: 'multi-khi', isp: 'Multinet', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'multi-lhe', isp: 'Multinet', city: 'Lahore', host: 'localhost', port: 3001 },
  { id: 'multi-isb', isp: 'Multinet', city: 'Islamabad', host: 'localhost', port: 3001 },
  { id: 'linkdotnet-khi', isp: 'Linkdotnet', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'ebone-khi', isp: 'E Bone Network', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'brain-khi', isp: 'Brain NET', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'brain-lhe', isp: 'Brain NET', city: 'Lahore', host: 'localhost', port: 3001 },
  { id: 'witribe-isb', isp: 'Wi-Tribe', city: 'Islamabad', host: 'localhost', port: 3001 },
  { id: 'witribe-lhe', isp: 'Wi-Tribe', city: 'Lahore', host: 'localhost', port: 3001 },
  { id: 'witribe-khi', isp: 'Wi-Tribe', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'worldcall-khi', isp: 'Worldcall', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'qubee-khi', isp: 'Qubee', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'onenet-khi', isp: 'One Network', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'nexlinx-khi', isp: 'NEXLINX', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'supernet-khi', isp: 'Supernet', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'gbear-khi', isp: 'Great Bear', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'wancom-khi', isp: 'Wancom', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'skynet-khi', isp: 'SkyNet', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'dancom-khi', isp: 'DanCom', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'jazz-khi', isp: 'Jazz', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'jazz-lhe', isp: 'Jazz', city: 'Lahore', host: 'localhost', port: 3001 },
  { id: 'jazz-isb', isp: 'Jazz', city: 'Islamabad', host: 'localhost', port: 3001 },
  { id: 'zong-khi', isp: 'Zong', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'zong-lhe', isp: 'Zong', city: 'Lahore', host: 'localhost', port: 3001 },
  { id: 'zong-isb', isp: 'Zong', city: 'Islamabad', host: 'localhost', port: 3001 },
  { id: 'telenor-khi', isp: 'Telenor', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'telenor-lhe', isp: 'Telenor', city: 'Lahore', host: 'localhost', port: 3001 },
  { id: 'ufone-khi', isp: 'Ufone', city: 'Karachi', host: 'localhost', port: 3001 },
  { id: 'ufone-lhe', isp: 'Ufone', city: 'Lahore', host: 'localhost', port: 3001 },
]

router.get('/', (req, res) => {
  const isps = {}
  for (const server of PAKISTAN_SERVER_DATA) {
    if (!isps[server.isp]) {
      isps[server.isp] = { name: server.isp, cities: [], servers: [] }
    }
    if (!isps[server.isp].cities.includes(server.city)) {
      isps[server.isp].cities.push(server.city)
    }
    isps[server.isp].servers.push({
      id: server.id,
      city: server.city,
      host: server.host,
      port: server.port,
    })
  }

  res.json({
    total: PAKISTAN_SERVER_DATA.length,
    isps: Object.values(isps),
    all: PAKISTAN_SERVER_DATA,
  })
})

router.options('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.end()
})

export default router
