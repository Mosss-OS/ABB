import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  const { Redis } = await import('@upstash/redis');
  return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
}

async function getBountyFromRedis(id: string, redis: any): Promise<any | null> {
  const data = await redis.get(`bounty:${id}`);
  return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
}

async function updateBountyInRedis(bounty: any, redis: any): Promise<void> {
  await redis.set(`bounty:${bounty.id}`, JSON.stringify(bounty));
}

async function updateAgentStats(agentFid: number, amountUsdc: number, redis: any): Promise<void> {
  await redis.hincrby(`agent:stats:${agentFid}`, 'tasksCompleted', 1);
  await redis.hincrbyfloat(`agent:stats:${agentFid}`, 'totalEarnedUsdc', amountUsdc);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bountyId, resultUrl } = body;

    if (!bountyId) {
      return NextResponse.json({ error: 'bountyId required' }, { status: 400 });
    }

    const redis = await getRedis();
    if (!redis) {
      return NextResponse.json({ error: 'Redis not configured' }, { status: 500 });
    }

    const bounty = await getBountyFromRedis(bountyId, redis);
    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
    }

    if (bounty.status !== 'assigned') {
      return NextResponse.json({ error: 'Bounty must be assigned before completing' }, { status: 400 });
    }

    const rewardAmount = bounty.reward || bounty.rewardUsdc || 0;
    
    bounty.status = 'settled';
    bounty.resultUrl = resultUrl || '';
    bounty.paidAmountUsdc = rewardAmount;
    bounty.settledAt = Math.floor(Date.now() / 1000);
    
    await updateBountyInRedis(bounty, redis);
    await updateAgentStats(bounty.workerFid, rewardAmount, redis);

    return NextResponse.json({ 
      bounty,
      message: 'Bounty completed successfully',
    });
  } catch (error) {
    console.error('[settle] POST error:', error);
    return NextResponse.json({ error: 'Failed to complete bounty' }, { status: 500 });
  }
}