import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MOCK_BOUNTIES = [
  { id: 'bnt_001', task: 'Translate this text to Spanish', type: 'translate', reward: 5, status: 'open', posterFid: 1234, deadlineTs: Math.floor(Date.now() / 1000) + 86400, taskDescription: 'Translate this text to Spanish' },
  { id: 'bnt_002', task: 'Summarize this article', type: 'summarize', reward: 3, status: 'open', posterFid: 1234, deadlineTs: Math.floor(Date.now() / 1000) + 86400, taskDescription: 'Summarize this article' },
  { id: 'bnt_003', task: 'Look up token price', type: 'onchain-lookup', reward: 2, status: 'assigned', posterFid: 1234, workerFid: 1235, deadlineTs: Math.floor(Date.now() / 1000) + 86400, taskDescription: 'Look up token price' },
];

const MOCK_ACTIVITIES = [
  { id: 'act_001', type: 'bounty_posted', agentUsername: 'bounty-poster', description: 'posted a new bounty', amount: 5, timestamp: Math.floor(Date.now() / 1000) - 300 },
  { id: 'act_002', type: 'bid_submitted', agentUsername: 'worker-alpha', description: 'submitted a bid', timestamp: Math.floor(Date.now() / 1000) - 600 },
  { id: 'act_003', type: 'work_completed', agentUsername: 'worker-beta', description: 'completed a task', amount: 3, timestamp: Math.floor(Date.now() / 1000) - 900 },
];

async function listActivitiesFromRedis(): Promise<any[]> {
  if (!process.env.UPSTASH_REDIS_REST_URL) return [];
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
    const items = await redis.lrange('activities:recent', 0, 19);
    return items.map(item => JSON.parse(item as string));
  } catch (error) {
    console.error('[api/bounties] Activity Redis error:', error);
    return [];
  }
}

async function listAllBountiesFromRedis(): Promise<any[]> {
  if (!process.env.UPSTASH_REDIS_REST_URL) return [];
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
    const ids = await redis.smembers('bounties:all');
    const bounties: any[] = [];
    for (const id of ids) {
      const data = await redis.get(`bounty:${id}`);
      if (data) bounties.push(JSON.parse(data as string));
    }
    return bounties.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('[api/bounties] Redis error:', error);
    return [];
  }
}

async function createBountyInRedis(bounty: any): Promise<void> {
  if (!process.env.UPSTASH_REDIS_REST_URL) return;
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
    await redis.set(`bounty:${bounty.id}`, JSON.stringify(bounty));
    await redis.sadd('bounties:all', bounty.id);
    await redis.sadd('bounties:open', bounty.id);
    
    // Log Activity
    const activity = {
      id: `act_${Date.now()}`,
      type: 'bounty_created',
      bountyId: bounty.id,
      description: `BROADCAST: NEW TASK "${bounty.task}" FOR ${bounty.rewardUsdc} USDC`,
      agentUsername: bounty.posterUsername,
      timestamp: Math.floor(Date.now() / 1000),
      amount: bounty.rewardUsdc,
    };
    await redis.lpush('activities:recent', JSON.stringify(activity));
    await redis.ltrim('activities:recent', 0, 49);
  } catch (error) {
    console.error('[api/bounties] createBounty error:', error);
  }
}

export async function GET() {
  const { checkRateLimit, getRateLimitHeaders } = await import('../../lib/rate-limit');
  const rateLimit = await checkRateLimit('/api/bounties');
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  
  if (hasRedis) {
    const bounties = await listAllBountiesFromRedis();
    const activities = await listActivitiesFromRedis();
    if (bounties.length > 0 || activities.length > 0) {
      return NextResponse.json({ 
        bounties: bounties.length > 0 ? bounties : MOCK_BOUNTIES, 
        activities: activities.length > 0 ? activities : MOCK_ACTIVITIES, 
        source: 'redis' 
      });
    }
  }
  
  return NextResponse.json({ bounties: MOCK_BOUNTIES, activities: MOCK_ACTIVITIES, source: 'mock' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskDescription, taskType, rewardUsdc, deadlineHours, posterFid, posterUsername } = body;

    if (!taskDescription || !taskType || !rewardUsdc || !deadlineHours) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { nanoid } = await import('nanoid');
    const id = `bnt_${nanoid(8)}`;
    const deadlineTs = Math.floor(Date.now() / 1000) + deadlineHours * 3600;

    const newBounty = {
      id,
      task: taskDescription,
      type: taskType,
      reward: rewardUsdc,
      status: 'open',
      posterFid: posterFid || 0,
      posterUsername: posterUsername || 'anonymous',
      deadlineTs,
      taskDescription,
      rewardUsdc,
      taskType,
      createdAt: Math.floor(Date.now() / 1000),
      castHash: '',
    };

    await createBountyInRedis(newBounty);

    return NextResponse.json({ bounty: newBounty, source: 'redis' });
  } catch (error) {
    console.error('[api/bounties] POST error:', error);
    return NextResponse.json({ error: 'Failed to create bounty' }, { status: 500 });
  }
}