import { Redis } from '@upstash/redis';
import type { Bounty, Bid } from '../../../../packages/shared/src/types';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export type ActivityType = 'bounty_posted' | 'bid_submitted' | 'work_completed' | 'payment_received';

export interface Activity {
  id: string;
  type: ActivityType;
  agentFid: number;
  agentUsername: string;
  bountyId?: string;
  description: string;
  amount?: number;
  timestamp: number;
}

export async function saveActivity(activity: Activity): Promise<void> {
  await redis.set(`activity:${activity.id}`, JSON.stringify(activity));
  await redis.lpush('activities:all', activity.id);
  await redis.ltrim('activities:all', 0, 99);
}

export async function getRecentActivities(limit = 20): Promise<Activity[]> {
  const ids = await redis.lrange('activities:all', 0, limit - 1);
  const activities = await Promise.all(ids.map(id => redis.get(`activity:${id}`)));
  return activities.map((a): Activity | null => a ? JSON.parse(a as string) : null).filter((a): a is Activity => a !== null);
}

export async function saveBounty(bounty: Bounty): Promise<void> {
  await redis.set(`bounty:${bounty.id}`, JSON.stringify(bounty));
  await redis.sadd('bounties:all', bounty.id);
  if (bounty.status === 'open') {
    await redis.sadd('bounties:open', bounty.id);
  }
}

export async function getBounty(id: string): Promise<Bounty | null> {
  const data = await redis.get(`bounty:${id}`);
  return data ? JSON.parse(data as string) : null;
}

export async function updateBountyStatus(
  id: string,
  status: Bounty['status'],
  extras?: Partial<Bounty>
): Promise<void> {
  const bounty = await getBounty(id);
  if (!bounty) return;
  
  const updated = { ...bounty, status, ...extras };
  await redis.set(`bounty:${id}`, JSON.stringify(updated));
  
  if (status === 'open') {
    await redis.sadd('bounties:open', id);
  } else {
    await redis.srem('bounties:open', id);
  }
}

export async function listOpenBounties(): Promise<Bounty[]> {
  const ids = await redis.smembers('bounties:open');
  const bounties = await Promise.all(ids.map(id => getBounty(id)));
  return bounties.filter((b): b is Bounty => b !== null && b.status === 'open');
}

export async function listAllBounties(): Promise<Bounty[]> {
  const ids = await redis.smembers('bounties:all');
  const bounties = await Promise.all(ids.map(id => getBounty(id)));
  return bounties.filter((b): b is Bounty => b !== null);
}

export async function saveBid(bid: Bid): Promise<void> {
  await redis.set(`bid:${bid.id}`, JSON.stringify(bid));
  await redis.lpush(`bids:${bid.bountyId}`, bid.id);
}

export async function getBidsForBounty(bountyId: string): Promise<Bid[]> {
  const ids = await redis.lrange(`bids:${bountyId}`, 0, -1);
  const bids = await Promise.all(ids.map(id => redis.get(`bid:${id}`)));
  return bids.map((b): Bid => JSON.parse(b as string)).filter(b => b);
}

export async function incrementAgentStats(fid: number, usdcEarned: number): Promise<void> {
  await redis.hincrby(`agent:stats:${fid}`, 'tasksCompleted', 1);
  await redis.hincrbyfloat(`agent:stats:${fid}`, 'totalEarnedUsdc', usdcEarned);
}

export async function getAgentStats(fid: number): Promise<{ tasksCompleted: number; totalEarnedUsdc: number }> {
  const data = await redis.hgetall(`agent:stats:${fid}`);
  return {
    tasksCompleted: Number(data?.tasksCompleted) || 0,
    totalEarnedUsdc: Number(data?.totalEarnedUsdc) || 0,
  };
}

export async function setAgentWallet(fid: number, walletAddress: string): Promise<void> {
  await redis.set(`agent:wallet:${fid}`, walletAddress);
}

export async function getAgentWallet(fid: number): Promise<string | null> {
  return await redis.get(`agent:wallet:${fid}`);
}
