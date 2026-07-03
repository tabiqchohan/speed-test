const SIZE_MAP = {
  '10mb': 10 * 1024 * 1024,
  '50mb': 50 * 1024 * 1024,
  '100mb': 100 * 1024 * 1024,
}

export function getSize(sizeParam) {
  return SIZE_MAP[sizeParam] || SIZE_MAP['50mb']
}

export function* generateBytes(size) {
  const chunkSize = 65536
  let remaining = size
  const pattern = Buffer.alloc(chunkSize)
  for (let i = 0; i < chunkSize; i++) {
    pattern[i] = i % 256
  }

  while (remaining > 0) {
    const send = Math.min(remaining, chunkSize)
    yield send === chunkSize ? pattern : pattern.slice(0, send)
    remaining -= send
  }
}
