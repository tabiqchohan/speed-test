import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const start = performance.now();

  const blob = await request.blob();
  const size = blob.size;

  const end = performance.now();
  const duration = end - start;

  const averageMbps = duration > 0 ? (size / duration) * 8 / 1000 / 1000 : 0;

  return NextResponse.json(
    {
      size,
      duration: Math.round(duration),
      unit: 'ms',
      average: Math.round(averageMbps * 100) / 100,
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}
