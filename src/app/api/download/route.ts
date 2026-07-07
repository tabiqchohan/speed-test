import { NextRequest, NextResponse } from 'next/server';

function parseSize(sizeParam: string | null): number {
  if (!sizeParam) return 5242880;
  const match = sizeParam.match(/^(\d+)\s*(mb|gb|kb)?$/i);
  if (!match) return 5242880;
  const num = parseInt(match[1], 10);
  const unit = (match[2] || '').toLowerCase();
  if (unit === 'gb') return num * 1024 * 1024 * 1024;
  if (unit === 'mb') return num * 1024 * 1024;
  if (unit === 'kb') return num * 1024;
  return num;
}

function parseSamples(samplesParam: string | null): number {
  if (!samplesParam) return 2;
  const num = parseInt(samplesParam, 10);
  if (isNaN(num) || num < 1) return 2;
  return Math.min(num, 10);
}

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = parseSize(searchParams.get('size'));
  const samples = parseSamples(searchParams.get('samples'));

  const elapsed = 10 + Math.random() * 40;
  const simulatedSpeedMbps = (size / elapsed) * 8 / 1000;
  const averageMbps = simulatedSpeedMbps / samples;

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  };

  return NextResponse.json(
    {
      size,
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
