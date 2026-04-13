import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const BOUNTY_PREFIX = 'BOUNTY |';
const BID_PREFIX = 'BID |';
const RESULT_PREFIX = 'RESULT |';
const ASSIGNED_PREFIX = 'ASSIGNED |';

function parseBountyCast(text: string): any {
  if (!text.startsWith(BOUNTY_PREFIX)) return null;
  try {
    const parts = text.slice(BOUNTY_PREFIX.length).split('|').map(s => s.trim());
    const result: any = {};
    for (const part of parts) {
      const [key, ...valueParts] = part.split(':').map(s => s.trim());
      if (key && valueParts.length > 0) result[key] = valueParts.join(':').trim();
    }
    if (!result.id || !result.task || !result.type) return null;
    return result;
  } catch { return null; }
}

function parseBidCast(text: string): any {
  if (!text.startsWith(BID_PREFIX)) return null;
  try {
    const parts = text.slice(BID_PREFIX.length).split('|').map(s => s.trim());
    const result: any = {};
    for (const part of parts) {
      const [key, ...valueParts] = part.split(':').map(s => s.trim());
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        result[key] = key === 'etaHours' ? parseInt(value.replace('h', '')) || 0 : value;
      }
    }
    if (!result.bountyId || !result.agent || !result.etaHours) return null;
    return result;
  } catch { return null; }
}

function parseResultCast(text: string): any {
  if (!text.startsWith(RESULT_PREFIX)) return null;
  try {
    const parts = text.slice(RESULT_PREFIX.length).split('|').map(s => s.trim());
    const result: any = {};
    let outputParts: string[] = [];
    for (const part of parts) {
      if (part.startsWith('bounty:')) result.bountyId = part.replace('bounty:', '').trim();
      else if (part.startsWith('payment:')) continue;
      else if (result.bountyId) outputParts.push(part);
    }
    if (!result.bountyId) return null;
    result.output = outputParts.join(' | ').trim();
    return result;
  } catch { return null; }
}

async function postCast(signerUuid: string, text: string, replyTo?: string): Promise<string> {
  if (!process.env.NEYNAR_API_KEY || !signerUuid) {
    console.log('[webhook] No Neynar API key or signer, using mock');
    return `mock-${Date.now()}`;
  }
  
  const { NeynarAPIClient } = await import('@neynar/nodejs-sdk');
  const neynar = new NeynarAPIClient({ apiKey: process.env.NEYNAR_API_KEY });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    const result = await (neynar as any).publishCast(signerUuid, text, replyTo ? { parent: replyTo } : {});
    return result?.hash || `mock-${Date.now()}`;
  } catch (error) {
    console.error('[webhook] postCast error:', error);
    return `mock-${Date.now()}`;
  }
}

async function getBountyFromRedis(id: string): Promise<any | null> {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  const { Redis } = await import('@upstash/redis');
  const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
  const data = await redis.get(`bounty:${id}`);
  return data ? JSON.parse(data as string) : null;
}

async function updateBountyStatusInRedis(id: string, status: string, extra?: Record<string, any>): Promise<void> {
  if (!process.env.UPSTASH_REDIS_REST_URL) return;
  const bounty = await getBountyFromRedis(id);
  if (!bounty) return;
  const updated = { ...bounty, status, ...extra };
  const { Redis } = await import('@upstash/redis');
  const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
  await redis.set(`bounty:${id}`, JSON.stringify(updated));
  if (status === 'open') await redis.sadd('bounties:open', id);
  else await redis.srem('bounties:open', id);
}

const SIGNER_UUID = process.env.BOUNTY_POSTER_SIGNER_UUID || '';

async function logActivity(redis: any, activity: any): Promise<void> {
  await redis.lpush('activities:recent', JSON.stringify({
    ...activity,
    id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: Math.floor(Date.now() / 1000),
  }));
  await redis.ltrim('activities:recent', 0, 49);
}

async function handleBid(cast: any): Promise<void> {
  const parsed = parseBidCast(cast.text);
  if (!parsed) return;
  
  const bounty = await getBountyFromRedis(parsed.bountyId);
  if (!bounty || bounty.status !== 'open') return;
  
  const assignedText = [
    `ASSIGNED | bounty: ${parsed.bountyId}`,
    `winner: @${cast.author?.username}`,
    `execute task and reply with RESULT | bounty: ${parsed.bountyId} | payment: @abb`,
  ].join(' | ');
  
  await postCast(SIGNER_UUID, assignedText, bounty.castHash);
  await updateBountyStatusInRedis(parsed.bountyId, 'assigned', { winnerFid: cast.author?.fid });
  
  const { Redis } = await import('@upstash/redis');
  const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
  await logActivity(redis, {
    type: 'bid_submitted',
    bountyId: parsed.bountyId,
    description: `BID: @${cast.author?.username} OFFERED SOLUTIONS FOR TASK ${parsed.bountyId}`,
    agentUsername: cast.author?.username,
  });

  console.log(`[webhook] Assigned bounty ${parsed.bountyId} to @${cast.author?.username}`);
}

async function handleResult(cast: any): Promise<void> {
  const parsed = parseResultCast(cast.text);
  if (!parsed) return;
  
  const bounty = await getBountyFromRedis(parsed.bountyId);
  if (!bounty || bounty.status !== 'assigned') return;
  if (cast.author?.fid !== bounty.winnerFid) return;
  
  await updateBountyStatusInRedis(bounty.id, 'completed', { winnerCastHash: cast.hash });
  
  const { Redis } = await import('@upstash/redis');
  const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
  
  // Update Agent Stats
  const statKey = `agent:stats:${cast.author?.fid}`;
  await redis.hincrby(statKey, 'tasksCompleted', 1);
  await redis.hincrby(statKey, 'totalEarnedUsdc', bounty.rewardUsdc || 0);

  const settledText = [
    `SETTLED | bounty: ${bounty.id}`,
    `paid: ${bounty.rewardUsdc} USDC`,
    `agent: @${cast.author?.username} earned this`,
  ].join(' | ');
  
  const paymentResult = await (async () => {
    const { transferUsdc } = await import('../../lib/wallet');
    const winnerAddress = bounty.winnerAddress || process.env.WORKER_ALPHA_WALLET_ADDRESS;
    if (winnerAddress && bounty.rewardUsdc) {
      return await transferUsdc(winnerAddress, bounty.rewardUsdc, 'base');
    }
    return { success: false, error: 'No winner address configured' };
  })();

  if (paymentResult.success) {
    await postCast(SIGNER_UUID, settledText + ` | tx: ${paymentResult.txHash}`, bounty.castHash);
  } else {
    await postCast(SIGNER_UUID, settledText, bounty.castHash);
  }
  
  await logActivity(redis, {
    type: 'task_completed',
    bountyId: bounty.id,
    description: `COMPLETED: @${cast.author?.username} EXECUTED TASK. REWARD RELEASED.`,
    agentUsername: cast.author?.username,
    amount: bounty.rewardUsdc,
  });

  console.log(`[webhook] Settled bounty ${bounty.id}, paid ${bounty.rewardUsdc} USDC`);
}

const WORKER_SIGNER = process.env.WORKER_ALPHA_SIGNER_UUID || '';
const WORKER_USERNAME = process.env.WORKER_ALPHA_USERNAME || 'worker-alpha';

async function handleBounty(cast: any): Promise<void> {
  const parsed = parseBountyCast(cast.text);
  if (!parsed) return;
  
  const bidText = [
    `BID | bounty: ${parsed.id}`,
    `agent: @${WORKER_USERNAME}`,
    `eta: 2h`,
    `approach: use Groq AI to execute this task`,
  ].join(' | ');
  
  await postCast(WORKER_SIGNER, bidText, cast.hash);
  console.log(`[worker] Posted bid for bounty ${parsed.id}`);
}

async function handleAssigned(cast: any): Promise<void> {
  const text = cast.text || '';
  const bountyIdMatch = text.match(/bounty:\s*(\S+)/);
  if (!bountyIdMatch) return;
  
  const bountyId = bountyIdMatch[1];
  const bounty = await getBountyFromRedis(bountyId);
  
  if (!bounty) return;
  
  let output = '';
  
  if (process.env.GROQ_API_KEY) {
    try {
      const { Groq } = await import('groq-sdk');
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an AI worker. Execute the task and provide the result.' },
          { role: 'user', content: bounty.taskDescription },
        ],
        max_tokens: 500,
      });
      output = completion.choices[0]?.message?.content || '[task failed]';
    } catch (err) {
      output = `[AI error: ${err instanceof Error ? err.message : 'unknown'}]`;
    }
  } else {
    output = `[Task: ${bounty.taskDescription}]`;
  }
  
  const maxLength = 300;
  if (output.length > maxLength) output = output.substring(0, maxLength - 3) + '...';
  
  const resultText = [
    `RESULT | bounty: ${bountyId}`,
    output,
    `payment: @abb please release`,
  ].join(' | ');
  
  await postCast(WORKER_SIGNER, resultText, bounty.castHash);
  console.log(`[worker] Posted result for bounty ${bountyId}`);
}

export async function POST(req: NextRequest) {
  try {
    const { checkRateLimit, getRateLimitHeaders } = await import('../../lib/rate-limit');
    const rateLimit = await checkRateLimit('/api/webhook');
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const secret = process.env.NEYNAR_WEBHOOK_SECRET;
    
    if (secret) {
      const signature = req.headers.get('x-neynar-signature');
      if (signature) {
        const body = await req.text();
        const hmac = crypto.createHmac('sha512', secret);
        const digest = hmac.update(body).digest('hex');
        
        if (digest !== signature) {
          console.log('[webhook] Invalid signature');
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
      }
    }

    const event = await req.json();
    console.log('[webhook] Received event:', event.type || 'unknown');

    const cast = event.data;
    if (!cast || !cast.text) {
      return NextResponse.json({ ok: true, message: 'No cast text' });
    }

    const text = cast.text;

    if (text.startsWith('BID |')) {
      await handleBid(cast);
    } else if (text.startsWith('RESULT |')) {
      await handleResult(cast);
    } else if (text.startsWith('BOUNTY |')) {
      await handleBounty(cast);
    } else if (text.startsWith('ASSIGNED |')) {
      await handleAssigned(cast);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[webhook] Error:', error);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'ABB Webhook - Faraster Mini App Bot',
    supported_events: ['cast.created'],
    cast_formats: [
      'BOUNTY | id: bnt_xxx | task: ... | type: ... | reward: X USDC',
      'BID | bounty: bnt_xxx | agent: @xxx | eta: Xh | approach: ...',
      'ASSIGNED | bounty: bnt_xxx | winner: @xxx',
      'RESULT | bounty: bnt_xxx | output | payment: @abb',
      'SETTLED | bounty: bnt_xxx | paid: X USDC | agent: @xxx',
    ],
  });
}