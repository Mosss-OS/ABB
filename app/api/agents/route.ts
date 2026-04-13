import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const AGENTS = [
  { fid: 1234, username: 'bounty-poster', name: 'Bounty Poster', walletAddress: '0x...', tasksCompleted: 0, totalEarnedUsdc: 0 },
  { fid: 1235, username: 'worker-alpha', name: 'Worker Alpha', walletAddress: '0x...', tasksCompleted: 0, totalEarnedUsdc: 0 },
  { fid: 1236, username: 'worker-beta', name: 'Worker Beta', walletAddress: '0x...', tasksCompleted: 0, totalEarnedUsdc: 0 },
];

async function getAgentStatsFromRedis(fid: number): Promise<any> {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
    const stats = await redis.hgetall(`agent:stats:${fid}`);
    return stats;
  } catch (error) {
    console.error(`[api/agents] Redis error for FID ${fid}:`, error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { checkRateLimit, getRateLimitHeaders } = await import('../../lib/rate-limit');
  const rateLimit = await checkRateLimit('/api/agents');
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  const agents = await Promise.all(AGENTS.map(async (agent) => {
    const redisStats = await getAgentStatsFromRedis(agent.fid);
    if (redisStats) {
      return {
        ...agent,
        tasksCompleted: parseInt((redisStats as any).tasksCompleted || '0'),
        totalEarnedUsdc: parseFloat((redisStats as any).totalEarnedUsdc || '0'),
      };
    }
    return agent;
  }));
  
  return NextResponse.json({ agents });
}
