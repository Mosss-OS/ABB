import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const start = Date.now();
  
  const response = NextResponse.next();
  
  response.headers.set('x-response-time', Date.now().toString());
  response.headers.set('x-request-id', crypto.randomUUID());
  
  const onFinish = () => {
    const duration = Date.now() - start;
    const log = {
      method: request.method,
      path: request.nextUrl.pathname,
      status: response.status,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };
    console.log('[request]', JSON.stringify(log));
  };
  
  request.headers.set('x-middleware-start', start.toString());
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};