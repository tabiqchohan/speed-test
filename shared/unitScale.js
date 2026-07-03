export function scaleSpeed(bitsPerSecond) {
  if (bitsPerSecond >= 1000000000) {
    return {
      value: (bitsPerSecond / 1000000000).toFixed(2),
      unit: 'Gbps',
      raw: bitsPerSecond,
    }
  }
  if (bitsPerSecond >= 1000000) {
    return {
      value: (bitsPerSecond / 1000000).toFixed(1),
      unit: 'Mbps',
      raw: bitsPerSecond,
    }
  }
  if (bitsPerSecond >= 1000) {
    return {
      value: (bitsPerSecond / 1000).toFixed(0),
      unit: 'Kbps',
      raw: bitsPerSecond,
    }
  }
  return {
    value: bitsPerSecond.toFixed(0),
    unit: 'bps',
    raw: bitsPerSecond,
  }
}

export function dualDisplay(bitsPerSecond) {
  const primary = scaleSpeed(bitsPerSecond)
  let secondary
  if (primary.unit === 'Gbps') {
    secondary = (bitsPerSecond / 1000000).toFixed(0) + ' Mbps'
  } else if (primary.unit === 'Mbps') {
    secondary = (bitsPerSecond / 1000).toFixed(0) + ' Kbps'
  } else {
    secondary = bitsPerSecond.toFixed(0) + ' bps'
  }
  return { primary, secondary }
}
