const PAKISTAN_SERVER_LIST = [
  { id: 'ptcl-khi', isp: 'PTCL', city: 'Karachi' },
  { id: 'ptcl-lhe', isp: 'PTCL', city: 'Lahore' },
  { id: 'ptcl-isb', isp: 'PTCL', city: 'Islamabad' },
  { id: 'ptcl-pew', isp: 'PTCL', city: 'Peshawar' },
  { id: 'ptcl-qta', isp: 'PTCL', city: 'Quetta' },
  { id: 'ptcl-mux', isp: 'PTCL', city: 'Multan' },
  { id: 'ptcl-fsd', isp: 'PTCL', city: 'Faisalabad' },
  { id: 'ptcl-rwp', isp: 'PTCL', city: 'Rawalpindi' },
  { id: 'ptcl-hyd', isp: 'PTCL', city: 'Hyderabad' },
  { id: 'ptcl-skt', isp: 'PTCL', city: 'Sialkot' },
  { id: 'ptcl-guj', isp: 'PTCL', city: 'Gujranwala' },
  { id: 'tw1-khi', isp: 'Transworld', city: 'Karachi' },
  { id: 'tw1-lhe', isp: 'Transworld', city: 'Lahore' },
  { id: 'tw1-isb', isp: 'Transworld', city: 'Islamabad' },
  { id: 'storm-khi', isp: 'StormFiber', city: 'Karachi' },
  { id: 'storm-lhe', isp: 'StormFiber', city: 'Lahore' },
  { id: 'storm-isb', isp: 'StormFiber', city: 'Islamabad' },
  { id: 'storm-fsd', isp: 'StormFiber', city: 'Faisalabad' },
  { id: 'cyber-khi', isp: 'Cybernet', city: 'Karachi' },
  { id: 'cyber-lhe', isp: 'Cybernet', city: 'Lahore' },
  { id: 'cyber-isb', isp: 'Cybernet', city: 'Islamabad' },
  { id: 'naya-isb', isp: 'Nayatel', city: 'Islamabad' },
  { id: 'naya-rwp', isp: 'Nayatel', city: 'Rawalpindi' },
  { id: 'naya-lhe', isp: 'Nayatel', city: 'Lahore' },
  { id: 'naya-fsd', isp: 'Nayatel', city: 'Faisalabad' },
  { id: 'naya-pew', isp: 'Nayatel', city: 'Peshawar' },
  { id: 'optix-khi', isp: 'Optix', city: 'Karachi' },
  { id: 'optix-lhe', isp: 'Optix', city: 'Lahore' },
  { id: 'fiberlink-khi', isp: 'Fiberlink', city: 'Karachi' },
  { id: 'fiberlink-lhe', isp: 'Fiberlink', city: 'Lahore' },
  { id: 'fiberlink-hyd', isp: 'Fiberlink', city: 'Hyderabad' },
  { id: 'connect-khi', isp: 'Connect Communication', city: 'Karachi' },
  { id: 'connect-hyd', isp: 'Connect Communication', city: 'Hyderabad' },
  { id: 'wateen-lhe', isp: 'Wateen', city: 'Lahore' },
  { id: 'wateen-khi', isp: 'Wateen', city: 'Karachi' },
  { id: 'wateen-isb', isp: 'Wateen', city: 'Islamabad' },
  { id: 'multi-khi', isp: 'Multinet', city: 'Karachi' },
  { id: 'multi-lhe', isp: 'Multinet', city: 'Lahore' },
  { id: 'multi-isb', isp: 'Multinet', city: 'Islamabad' },
  { id: 'linkdotnet-khi', isp: 'Linkdotnet', city: 'Karachi' },
  { id: 'ebone-khi', isp: 'E Bone Network', city: 'Karachi' },
  { id: 'brain-khi', isp: 'Brain NET', city: 'Karachi' },
  { id: 'brain-lhe', isp: 'Brain NET', city: 'Lahore' },
  { id: 'witribe-isb', isp: 'Wi-Tribe', city: 'Islamabad' },
  { id: 'witribe-lhe', isp: 'Wi-Tribe', city: 'Lahore' },
  { id: 'witribe-khi', isp: 'Wi-Tribe', city: 'Karachi' },
  { id: 'worldcall-khi', isp: 'Worldcall', city: 'Karachi' },
  { id: 'qubee-khi', isp: 'Qubee', city: 'Karachi' },
  { id: 'onenet-khi', isp: 'One Network', city: 'Karachi' },
  { id: 'nexlinx-khi', isp: 'NEXLINX', city: 'Karachi' },
  { id: 'supernet-khi', isp: 'Supernet', city: 'Karachi' },
  { id: 'gbear-khi', isp: 'Great Bear', city: 'Karachi' },
  { id: 'wancom-khi', isp: 'Wancom', city: 'Karachi' },
  { id: 'skynet-khi', isp: 'SkyNet', city: 'Karachi' },
  { id: 'dancom-khi', isp: 'DanCom', city: 'Karachi' },
  { id: 'jazz-khi', isp: 'Jazz', city: 'Karachi' },
  { id: 'jazz-lhe', isp: 'Jazz', city: 'Lahore' },
  { id: 'jazz-isb', isp: 'Jazz', city: 'Islamabad' },
  { id: 'zong-khi', isp: 'Zong', city: 'Karachi' },
  { id: 'zong-lhe', isp: 'Zong', city: 'Lahore' },
  { id: 'zong-isb', isp: 'Zong', city: 'Islamabad' },
  { id: 'telenor-khi', isp: 'Telenor', city: 'Karachi' },
  { id: 'telenor-lhe', isp: 'Telenor', city: 'Lahore' },
  { id: 'ufone-khi', isp: 'Ufone', city: 'Karachi' },
  { id: 'ufone-lhe', isp: 'Ufone', city: 'Lahore' },
]

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const isps = {}
  for (const server of PAKISTAN_SERVER_LIST) {
    if (!isps[server.isp]) {
      isps[server.isp] = { name: server.isp, cities: [], servers: [] }
    }
    if (!isps[server.isp].cities.includes(server.city)) {
      isps[server.isp].cities.push(server.city)
    }
    isps[server.isp].servers.push({ id: server.id, city: server.city })
  }

  res.status(200).json({
    total: PAKISTAN_SERVER_LIST.length,
    isps: Object.values(isps),
    all: PAKISTAN_SERVER_LIST,
  })
}
