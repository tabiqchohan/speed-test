import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let ip = searchParams.get('ip');

  if (!ip) {
    ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || request.headers.get('cf-connecting-ip')
      || '';
  }

  if (!ip) {
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json() as { ip: string };
      ip = ipData.ip;
    } catch {
      return NextResponse.json(
        { error: 'Could not determine IP address' },
        {
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
        }
      );
    }
  }

  try {
    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,isp,org,as,city,region,country,query`,
      { signal: AbortSignal.timeout(5000) }
    );

    const data = await response.json() as {
      status: string;
      isp: string;
      org: string;
      as: string;
      city: string;
      region: string;
      country: string;
      query: string;
    };

    if (data.status === 'fail') {
      return NextResponse.json(
        { error: 'IP lookup failed', ip },
        {
          status: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    return NextResponse.json(
      {
        ip: data.query,
        isp: data.isp,
        org: data.org,
        as: data.as,
        city: data.city,
        region: data.region,
        country: data.country,
      },
      {
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch {
    return NextResponse.json(
      { error: 'ISP lookup service unavailable' },
      {
        status: 502,
        headers: { 'Access-Control-Allow-Origin': '*' },
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
