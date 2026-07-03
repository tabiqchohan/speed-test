export const config = {
  maxDuration: 30,
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const sizeParam = req.query.size || '10mb'
  const sizeMap = { '10mb': 10485760, '50mb': 52428800, '100mb': 104857600 }
  let size = sizeMap[sizeParam] || 10485760

  if (size > 10485760) {
    size = 10485760
  }

  const chunkSize = 65536
  const buffer = Buffer.alloc(size)
  for (let i = 0; i < size; i += chunkSize) {
    const len = Math.min(chunkSize, size - i)
    for (let j = 0; j < len; j++) {
      buffer[i + j] = (i + j) % 256
    }
  }

  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-Length': size.toString(),
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  })

  res.end(buffer)
}
