import { NextRequest, NextResponse } from 'next/server';

const TASK_TYPES = ['translate', 'summarize', 'onchain-lookup', 'custom'];

function canHandleTask(taskDescription: string, taskType: string): boolean {
  const lower = taskDescription.toLowerCase();
  
  if (taskType === 'translate' && /translate|spanish|french|german|chinese|japanese|korean/i.test(lower)) return true;
  if (taskType === 'summarize' && /summarize|summary|abstract/i.test(lower)) return true;
  if (taskType === 'onchain-lookup' && /price|token|blockchain|transaction|balance|nft/i.test(lower)) return true;
  if (taskType === 'custom') return true;
  
  return TASK_TYPES.includes(taskType);
}

function generateProposal(taskDescription: string, taskType: string): string {
  switch (taskType) {
    case 'translate':
      return `I will translate this text accurately using AI. Delivery in 1 hour.`;
    case 'summarize':
      return `I will provide a concise summary using Groq AI. Delivery in 30 minutes.`;
    case 'onchain-lookup':
      return `I will look up the requested on-chain data. Delivery in 15 minutes.`;
    default:
      return `I can complete this task using AI. Let me know if you need more details.`;
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const botToken = process.env.BOT_POLLER_TOKEN;
  
  // For Vercel cron jobs, we'll allow requests without auth in production
  // since they come from Vercel's internal system
  const isVercelCron = req.headers.get('user-agent')?.includes('Vercel Cron') || 
                       req.headers.get('x-vercel-cron-job-id');
  
  if (!isVercelCron && botToken && authHeader !== `Bearer ${botToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      return NextResponse.json({ error: 'Redis not configured' }, { status: 503 });
    }

    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ 
      url: process.env.UPSTASH_REDIS_REST_URL, 
      token: process.env.UPSTASH_REDIS_REST_TOKEN 
    });

    // Use environment variables for cron jobs, fallback to body for manual calls
    const agentFid = parseInt(process.env.BOT_POLLER_AGENT_FID || '9999');
    const agentUsername = process.env.BOT_POLLER_AGENT_USERNAME || 'worker-alpha';
    const priceDiscount = parseFloat(process.env.BOT_POLLER_PRICE_DISCOUNT || '0.9');

    const bountyIds = await redis.smembers('bounties:open');
    const results: any[] = [];

    for (const bountyId of bountyIds) {
      const existingBidIds = await redis.smembers(`bounty:${bountyId}:bids`);
      let alreadyBid = false;
      
      // Check if we've already bid on this bounty
      for (const bidId of existingBidIds) {
        const bidData = await redis.get(`bid:${bidId}`);
        if (bidData && typeof bidData === 'string') {
          try {
            const bid = JSON.parse(bidData);
            if (bid.agentFid === agentFid) {
              alreadyBid = true;
              break;
            }
          } catch (e) {
            // Invalid JSON, skip
            continue;
          }
        }
      }

      if (alreadyBid) {
        results.push({ bountyId, status: 'skipped', reason: 'already_bid' });
        continue;
      }

      const bountyData = await redis.get(`bounty:${bountyId}`);
      if (!bountyData) continue;

      const bounty = JSON.parse(bountyData as string);
      
      if (!canHandleTask(bounty.taskDescription, bounty.taskType)) {
        results.push({ bountyId, status: 'skipped', reason: 'cannot_handle' });
        continue;
      }

      const priceUsdc = Math.round(bounty.rewardUsdc * priceDiscount * 100) / 100;
      const proposal = generateProposal(bounty.taskDescription, bounty.taskType);

      const { nanoid } = await import('nanoid');
      const bidId = `bid_${nanoid(8)}`;
      
      const bid = {
        id: bidId,
        bountyId,
        agentFid,
        agentUsername,
        proposal,
        priceUsdc,
        status: 'pending',
        createdAt: Math.floor(Date.now() / 1000),
        autoSubmitted: true,
      };

      await redis.set(`bid:${bidId}`, JSON.stringify(bid));
      await redis.sadd(`bounty:${bountyId}:bids`, bidId);
      
      const currentBidCount = await redis.get(`bounty:${bountyId}:bidCount`);
      await redis.set(`bounty:${bountyId}:bidCount`, String((parseInt((currentBidCount as string) || '0')) + 1));

      results.push({ bountyId, status: 'bid_submitted', bidId, priceUsdc });
    }

    return NextResponse.json({ 
      success: true, 
      processed: results.length,
      results 
    });
  } catch (error) {
    console.error('[api/bots/poller] error:', error);
    return NextResponse.json({ error: 'Poller failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Bot poller ready. POST to submit bids on open bounties.',
    env: {
      hasRedis: !!process.env.UPSTASH_REDIS_REST_URL,
      hasGroq: !!process.env.GROQ_API_KEY,
    }
  });
}