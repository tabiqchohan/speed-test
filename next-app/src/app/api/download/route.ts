import { NextRequest, NextResponse } from 'next/server';

function parseSize(sizeParam: string | null): number {
  if (!sizeParam) return 5 * 1024 * 1024;
  const match = sizeParam.match(/^(\d+)\s*(mb|gb|kb)?$/i);
  if (!match) return 5 * 1024 * 1024;
  const num = parseInt(match[1], 10);
  const unit = (match[2] || 'mb').toLowerCase();
  if (unit === 'gb') return num * 1024 * 1024 * 1024;
  if (unit === 'kb') return num * 1024;
  return num * 1024 * 1024;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = parseSize(searchParams.get('size'));

  const chunkSize = 65536;
  let bytesWritten = 0;

  const stream = new ReadableStream({
    start(controller) {
      function write() {
        while (bytesWritten < size) {
          const remaining = size - bytesWritten;
          const thisChunkSize = Math.min(chunkSize, remaining);
          const chunk = new Uint8Array(thisChunkSize);
          for (let i = 0; i < thisChunkSize; i += 4096) {
            const blockSize = Math.min(4096, thisChunkSize - i);
            const block = new Uint8Array(blockSize);
            crypto.getRandomValues(block);
            chunk.set(block, i);
          }
          controller.enqueue(chunk);
          bytesWritten += thisChunkSize;
        }
        controller.close();
      }
      write();
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': size.toString(),
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
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
