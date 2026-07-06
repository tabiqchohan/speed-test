import { NextRequest, NextResponse } from 'next/server';

function parseSize(sizeParam: string | null): number {
  if (!sizeParam) return 5242880;
  const match = sizeParam.match(/^(\d+)\s*(mb|gb|kb)?$/i);
  if (!match) return 5242880;
  const num = parseInt(match[1], 10);
  const unit = (match[2] || 'mb').toLowerCase();
  if (unit === 'gb') return num * 1024 * 1024 * 1024;
  if (unit === 'kb') return num * 1024;
  return num * 1024 * 1024;
}

function parseSamples(samplesParam: string | null): number {
  if (!samplesParam) return 2;
  const num = parseInt(samplesParam, 10);
  if (isNaN(num) || num < 1) return 2;
  return Math.min(num, 10);
}

function generateRandomBuffer(size: number): Uint8Array {
  const chunkSize = 65536;
  const buffer = new Uint8Array(size);
  let offset = 0;
  while (offset < size) {
    const thisChunkSize = Math.min(chunkSize, size - offset);
    const chunk = new Uint8Array(thisChunkSize);
    for (let i = 0; i < thisChunkSize; i += 4096) {
      const blockSize = Math.min(4096, thisChunkSize - i);
      const block = new Uint8Array(blockSize);
      crypto.getRandomValues(block);
      chunk.set(block, i);
    }
    buffer.set(chunk, offset);
    offset += thisChunkSize;
  }
  return buffer;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = parseSize(searchParams.get('size'));
  const samples = parseSamples(searchParams.get('samples'));

  const start = performance.now();
  const buffer = generateRandomBuffer(size);
  const elapsed = performance.now() - start;

  const simulatedSpeedMbps = (size / elapsed) * 8 / 1000;
  const averageMbps = simulatedSpeedMbps / samples;

  const base64 = Buffer.from(buffer).toString('base64');

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  };

  return NextResponse.json(
    {
      size,
      data: base64,
      average: Math.round(averageMbps * 100) / 100,
      currentMbps: Math.round(simulatedSpeedMbps * 100) / 100,
    },
    { headers }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}
