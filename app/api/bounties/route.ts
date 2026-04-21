import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    console.log('[api/bounties] Redis URL not set');
    return [];
  }
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
    console.log('[api/bounties] Connected to Redis');
    const ids = await redis.smembers('bounties:all');
    console.log('[api/bounties] Redis IDs found:', ids, 'count:', ids.length);
    const bounties: any[] = [];
    for (const id of ids) {
      const data = await redis.get(`bounty:${id}`);
      if (data) {
        const bounty = JSON.parse(data as string);
        const bidCount = await redis.get(`bounty:${id}:bidCount`);
        bounty.bidCount = parseInt((bidCount as string) || '0');
        bounties.push(bounty);
        console.log('[api/bounties] Loaded bounty:', bounty.id);
      } else {
        console.log('[api/bounties] No data found for bounty ID:', id);
      }
    }
    console.log('[api/bounties] Returning', bounties.length, 'bounties');
    return bounties.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('[api/bounties] Redis error:', error);
    return [];
  }
}

async function createBountyInRedis(bounty: any): Promise<void> {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    console.log('[api/bounties] Skipping Redis - no URL');
    return;
  }
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
    console.log('[api/bounties] Writing bounty to Redis:', bounty.id);
    await redis.set(`bounty:${bounty.id}`, JSON.stringify(bounty));
    await redis.sadd('bounties:all', bounty.id);
    await redis.sadd('bounties:open', bounty.id);
    console.log('[api/bounties] Bounty written successfully');
    
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
  console.log('[api/bounties] GET request - hasRedis:', hasRedis);
  
  if (!hasRedis) {
    return NextResponse.json({ 
      error: 'Redis not configured' 
    }, { status: 503 });
  }
  
  console.log('[api/bounties] GET request - fetching from Redis');
  const bounties = await listAllBountiesFromRedis();
  const activities = await listActivitiesFromRedis();
  console.log('[api/bounties] GET request - returning', bounties.length, 'bounties,', activities.length, 'activities');
  
  return NextResponse.json({ 
    bounties, 
    activities,
    source: 'redis'
  });
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