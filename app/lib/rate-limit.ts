import { Redis } from '@upstash/redis';

interface RateLimitConfig {
  window: number;
  limit: number;
}

const defaultConfig: Record<string, RateLimitConfig> = {
  '/api/webhook': { window: 60, limit: 10 },
  '/api/bounties': { window: 60, limit: 30 },
  '/api/agents': { window: 60, limit: 30 },
};

let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) return null;
  if (!redisClient) {
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

export async function checkRateLimit(
  key: string,
  config?: RateLimitConfig
): Promise<RateLimitResult> {
  const pathConfig = config || defaultConfig[key] || { window: 60, limit: 30 };
  const redis = getRedis();
  
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / pathConfig.window) * pathConfig.window;
  const redisKey = `ratelimit:${key}:${windowStart}`;
  
  if (!redis) {
    const inMemory = rateLimitInMemory.get(key);
    if (!inMemory) {
      rateLimitInMemory.set(key, { count: 1, reset: now + pathConfig.window });
      return { allowed: true, remaining: pathConfig.limit - 1, reset: now + pathConfig.window };
    }
    
    if (now > inMemory.reset) {
      inMemory.count = 1;
      inMemory.reset = now + pathConfig.window;
      return { allowed: true, remaining: pathConfig.limit - 1, reset: inMemory.reset };
    }
    
    if (inMemory.count >= pathConfig.limit) {
      return { allowed: false, remaining: 0, reset: inMemory.reset };
    }
    
    inMemory.count++;
    return { allowed: true, remaining: pathConfig.limit - inMemory.count, reset: inMemory.reset };
  }
  
  try {
    const count = await redis.incr(redisKey);
    
    if (count === 1) {
      await redis.expire(redisKey, pathConfig.window);
    }
    
    const remaining = Math.max(0, pathConfig.limit - count);
    const allowed = count <= pathConfig.limit;
    
    return { allowed, remaining, reset: windowStart + pathConfig.window };
  } catch (error) {
    console.error('[ratelimit] Error:', error);
    return { allowed: true, remaining: pathConfig.limit, reset: windowStart + pathConfig.window };
  }
}

const rateLimitInMemory = new Map<string, { count: number; reset: number }>();

export function createRateLimitMiddleware(pathConfig?: Record<string, RateLimitConfig>) {
  return async (request: Request): Promise<{ allowed: boolean; remaining: number; reset: number }> => {
    const url = new URL(request.url);
    const path = url.pathname;
    const config = pathConfig || defaultConfig;
    const pathLimit = config[path] || { window: 60, limit: 30 };
    
    const clientKey = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
    
    return checkRateLimit(`${path}:${clientKey}`, pathLimit);
  };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.remaining.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}