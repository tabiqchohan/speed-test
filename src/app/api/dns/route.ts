import { NextRequest, NextResponse } from 'next/server';
import { promises as dns } from 'dns';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain') || 'google.com';

  const start = performance.now();

  try {
    const addresses = await dns.resolve4(domain);
    const end = performance.now();

    return NextResponse.json(
      {
        domain,
        addresses,
        time: Math.round(end - start),
        unit: 'ms',
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { domain, error: 'DNS resolution failed', addresses: [], time: 0 },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
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
