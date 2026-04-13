import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.log('[redis] No Redis configured');
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

export interface Bounty {
  id: string;
  taskDescription: string;
  taskType: string;
  rewardUsdc: number;
  status: 'open' | 'assigned' | 'completed' | 'settled';
  castHash: string;
  winnerFid?: number;
  winnerAddress?: string;
  createdAt: number;
}

export async function saveBounty(bounty: Bounty): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  
  await redis.set(`bounty:${bounty.id}`, JSON.stringify(bounty));
  await redis.sadd('bounties:open', bounty.id);
}

export async function getBounty(id: string): Promise<Bounty | null> {
  const redis = getRedis();
  if (!redis) return null;
  
  const data = await redis.get(`bounty:${id}`);
  return data ? JSON.parse(data as string) : null;
}

export async function updateBountyStatus(
  id: string,
  status: Bounty['status'],
  extra?: Partial<Bounty>
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  
  const bounty = await getBounty(id);
  if (!bounty) return;
  
  const updated = { ...bounty, status, ...extra };
  await redis.set(`bounty:${id}`, JSON.stringify(updated));
  
  if (status === 'open') {
    await redis.sadd('bounties:open', id);
  } else {
    await redis.srem('bounties:open', id);
  }
}

export async function getOpenBounties(): Promise<Bounty[]> {
  const redis = getRedis();
  if (!redis) return [];
  
  const ids = await redis.smembers('bounties:open');
  const bounties: Bounty[] = [];
  
  for (const id of ids) {
    const bounty = await getBounty(id);
    if (bounty) bounties.push(bounty);
  }
  
  return bounties;
}

export interface Activity {
  id: string;
  type: string;
  bountyId: string;
  description: string;
  timestamp: number;
}

export async function logActivity(activity: Omit<Activity, 'id' | 'timestamp'>): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  
  const entry: Activity = {
    ...activity,
    id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: Math.floor(Date.now() / 1000),
  };
  
  await redis.lpush('activities:recent', JSON.stringify(entry));
  await redis.ltrim('activities:recent', 0, 49);
}

export async function getRecentActivities(limit = 20): Promise<Activity[]> {
  const redis = getRedis();
  if (!redis) return [];
  
  const entries = await redis.lrange('activities:recent', 0, limit - 1);
  return entries.map((e: string) => JSON.parse(e));
}