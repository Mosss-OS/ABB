import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getBountyFromRedis(id: string): Promise<any | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: url.trim(), token: token.trim() });
    const data = await redis.get(`bounty:${id}`);
    return data ? JSON.parse(data as string) : null;
  } catch (error) {
    console.error('[api/bounties/[id]] Redis error:', error);
    return null;
  }
}

async function updateBountyInRedis(bounty: any): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: url.trim(), token: token.trim() });
    await redis.set(`bounty:${bounty.id}`, JSON.stringify(bounty));
  } catch (error) {
    console.error('[api/bounties/[id]] Update error:', error);
  }
}

async function listBidsForBounty(bountyId: string): Promise<any[]> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return [];
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: url.trim(), token: token.trim() });
    const ids = await redis.smembers(`bounty:${bountyId}:bids`);
    const bids: any[] = [];
    for (const id of ids) {
      const data = await redis.get(`bid:${id}`);
      if (data) bids.push(JSON.parse(data as string));
    }
    return bids.sort((a, b) => a.createdAt - b.createdAt);
  } catch (error) {
    console.error('[api/bounties/[id]] Bids error:', error);
    return [];
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const bounty = await getBountyFromRedis(id);
  
  if (!bounty) {
    return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
  }

  const bids = await listBidsForBounty(id);
  const bidCount = bids.length;
  
  const { searchParams } = new URL(req.url);
  const includeBids = searchParams.get('includeBids') === 'true';

  return NextResponse.json({ 
    bounty: { ...bounty, bidCount },
    bids: includeBids ? bids : undefined,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
    const { status, winnerBidId, workerFid, workerUsername } = body;

    const bounty = await getBountyFromRedis(id);
    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
    }

    if (status) {
      bounty.status = status;
    }
    if (winnerBidId) {
      bounty.winnerBidId = winnerBidId;
      bounty.workerFid = workerFid;
      bounty.workerUsername = workerUsername;
      bounty.status = 'assigned';
    }
    bounty.updatedAt = Math.floor(Date.now() / 1000);

    await updateBountyInRedis(bounty);

    return NextResponse.json({ bounty });
  } catch (error) {
    console.error('[api/bounties/[id]] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update bounty' }, { status: 500 });
  }
}