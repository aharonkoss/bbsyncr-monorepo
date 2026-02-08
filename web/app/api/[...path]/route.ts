import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.RAILWAY_API_URL || 'https://api.bbsynr.com';

export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return handleRequest(request, 'PUT');
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request, 'PATCH');
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request, 'DELETE');
}

async function handleRequest(request: NextRequest, method: string) {
  const path = request.nextUrl.pathname.replace('/api', '');
  const search = request.nextUrl.search;
  
  const url = `${API_URL}/api${path}${search}`;
  
  const headers: HeadersInit = {
    'Content-Type': request.headers.get('content-type') || 'application/json',
  };
  
  // Forward cookies from the request
  const cookie = request.headers.get('cookie');
  if (cookie) {
    headers['Cookie'] = cookie;
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  // Add body for POST/PUT/PATCH
  if (method !== 'GET' && method !== 'DELETE') {
    options.body = await request.text();
  }

  try {
    const response = await fetch(url, options);
    const data = await response.text();
    
    // Forward Set-Cookie headers from Railway to browser
    const setCookieHeader = response.headers.get('set-cookie');
    
    const nextResponse = new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
    
    if (setCookieHeader) {
      nextResponse.headers.set('Set-Cookie', setCookieHeader);
    }
    
    return nextResponse;
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 500 }
    );
  }
}
