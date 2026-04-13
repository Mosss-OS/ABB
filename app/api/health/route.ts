import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  if (process.env.UPSTASH_REDIS_REST_URL) {
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      
      await redis.ping();
      checks.redis = 'connected';
    } catch {
      checks.redis = 'error';
    }
  }

  let allOk = Object.values(checks).every(v => v === 'ok' || v === 'connected');

  return NextResponse.json(checks, {
    status: allOk ? 200 : 503,
  });
}