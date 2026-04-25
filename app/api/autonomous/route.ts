import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WORKER_FID = parseInt(process.env.WORKER_FID || '994355');
const WORKER_USERNAME = process.env.WORKER_USERNAME || 'mosss';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = 'llama-3.1-70b-versatile';

const MIN_REWARD_THRESHOLD = 1; // Minimum reward in USDC to consider
const MAX_TASK_COMPLEXITY = 'medium'; // 'simple', 'medium', 'complex'

const TASK_TYPES_CAN_DO = [
  'translate', 'translation', 'summarize', 'summarization', 'general',
  'research', 'writing', 'analysis', 'math', 'calculate', 'code', 'debug',
  'explain', 'describe', 'create', 'generate', 'onchain-lookup',
  'what is', 'how many', 'what\'s', 'reply', 'say', 'hello'
];

const TASK_TYPES_CANT_DO = [
  'physical', 'deliver', 'phone', 'in-person', 'meet', 'walk', 'drive',
  'buy', 'purchase', 'ship', 'mail', 'hand-deliver'
];

async function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  if (!url) return null;
  const { Redis } = await import('@upstash/redis');
  return new Redis({ url, token });
}

async function getGroq() {
  if (!GROQ_API_KEY) return null;
  const { Groq } = await import('groq-sdk');
  return new Groq({ apiKey: GROQ_API_KEY });
}

async function getBounties(redis: any, status: string) {
  try {
    const bountyIds = await redis.smembers('bounties:all');
    if (!bountyIds || !Array.isArray(bountyIds)) return [];
    
    const bounties: any[] = [];
    for (const key of bountyIds) {
      if (!key) continue;
      const data = await redis.get(`bounty:${key}`);
      if (!data) continue;
      
      const bounty = typeof data === 'string' ? JSON.parse(data) : data;
      if (bounty && bounty.status === status) {
        bounties.push(bounty);
      }
    }
    return bounties;
  } catch (e) {
    console.error('[auto-worker] getBounties error:', e);
    return [];
  }
}

function checkTaskCapabilities(bounty: any): { canDo: boolean; reason: string } {
  const taskLower = (bounty.task || '').toLowerCase();
  const taskType = (bounty.type || '').toLowerCase();
  
  for (const cantDo of TASK_TYPES_CANT_DO) {
    if (taskLower.includes(cantDo) || taskType.includes(cantDo)) {
      return { canDo: false, reason: `Task requires ${cantDo} action I cannot perform` };
    }
  }
  
  let canDoType = false;
  for (const canDo of TASK_TYPES_CAN_DO) {
    if (taskLower.includes(canDo) || taskType.includes(canDo)) {
      canDoType = true;
      break;
    }
  }
  
  if (!canDoType) {
    const isSimpleTask = taskLower.length < 100;
    if (isSimpleTask) {
      return { canDo: true, reason: 'Simple task within AI capabilities' };
    }
    return { canDo: false, reason: 'Task type not recognized' };
  }
  
  if (bounty.reward < MIN_REWARD_THRESHOLD) {
    return { canDo: false, reason: `Reward ${bounty.reward} below threshold ${MIN_REWARD_THRESHOLD}` };
  }
  
  return { canDo: true, reason: 'Task is within my AI capabilities' };
}

async function evaluateWithAI(bounty: any, groq: any): Promise<{shouldBid: boolean; reason: string}> {
  if (!groq) {
    const simpleCheck = checkTaskCapabilities(bounty);
    return { shouldBid: simpleCheck.canDo, reason: simpleCheck.reason };
  }

  const taskType = bounty.type || 'general';
  const reward = bounty.reward || 0;
  const task = bounty.task || '';

  const prompt = `You are an autonomous AI agent deciding whether to bid on a bounty task.

Bounty Details:
- Task: ${task}
- Type: ${taskType}
- Reward: ${reward} USDC
- Posted by: ${bounty.posterUsername || 'unknown'}

Your Capabilities:
- Translation, summarization, research, writing, analysis
- Math calculations and code debugging
- Information retrieval and content generation
- Creating documents, emails, posts, descriptions

You CANNOT do:
- Physical actions (delivery, buying, meeting in person)
- Anything requiring phone/voice calls
- Tasks needing specific software/tools not available to AI
- Legal, medical, or financial advice requiring licenses

Evaluate:
1. Can you complete this task with AI capabilities?
2. Is the reward fair for the effort?
3. Is the task clear and well-defined?

Respond in this exact format:
YES - [brief reason]  OR  NO - [brief reason]`;

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content?.trim() || '';
    const shouldBid = response.toUpperCase().startsWith('YES');
    
    let reason = response;
    if (response.toUpperCase().startsWith('YES')) {
      reason = 'AI approved bidding: ' + response;
    } else {
      reason = 'AI rejected: ' + response;
    }
    
    return { shouldBid, reason };
  } catch (e) {
    console.error('[auto-worker] AI evaluation error:', e);
    const simpleCheck = checkTaskCapabilities(bounty);
    return { shouldBid: simpleCheck.canDo, reason: simpleCheck.reason + ' (AI error, fallback to rules)' };
  }
}

async function alreadyBid(bountyId: string, agentFid: number): Promise<boolean> {
  const redis = await getRedis();
  if (!redis) return false;
  
  try {
    const bidIds = await redis.smembers(`bounty:${bountyId}:bids`);
    if (!bidIds || !Array.isArray(bidIds)) return false;
    
    for (const bidId of bidIds) {
      if (!bidId) continue;
      const bidData = await redis.get(`bid:${bidId}`);
      if (!bidData) continue;
      
      const bid = typeof bidData === 'string' ? JSON.parse(bidData) : bidData;
      if (bid && bid.agentFid === agentFid) return true;
    }
    return false;
  } catch (e) {
    console.error('[auto-worker] alreadyBid error:', e);
    return false;
  }
}

async function submitBid(redis: any, bounty: any): Promise<boolean> {
  if (!WORKER_FID) return false;
  
  try {
    const bidId = `bid_${Date.now()}`;
    const bidData = {
      id: bidId,
      bountyId: bounty.id,
      agentFid: WORKER_FID,
      agentUsername: WORKER_USERNAME,
      proposal: 'AI-powered task execution using Groq LLM',
      priceUsdc: bounty.reward || 1,
      status: 'pending',
      createdAt: Math.floor(Date.now() / 1000),
    };

    await redis.set(`bid:${bidId}`, JSON.stringify(bidData));
    await redis.sadd(`bounty:${bounty.id}:bids`, bidId);
    console.log(`[auto-worker] Submitted bid ${bidId} on ${bounty.id}`);
    return true;
  } catch (e) {
    console.error('[auto-worker] submitBid error:', e);
    return false;
  }
}

async function acceptBid(redis: any, bountyId: string, workerFid: number, workerUsername: string): Promise<boolean> {
  try {
    const bountyData = await redis.get(`bounty:${bountyId}`);
    if (!bountyData) return false;
    
    const bounty = typeof bountyData === 'string' ? JSON.parse(bountyData) : bountyData;
    if (!bounty || bounty.status !== 'open') return false;
    
    const updatedBounty = {
      ...bounty,
      status: 'assigned',
      workerFid,
      workerUsername,
      updatedAt: Math.floor(Date.now() / 1000),
    };
    
    await redis.set(`bounty:${bountyId}`, JSON.stringify(updatedBounty));
    console.log(`[auto-worker] Accepted bid for bounty ${bountyId}`);
    return true;
  } catch (e) {
    console.error('[auto-worker] acceptBid error:', e);
    return false;
  }
}

async function settleBounty(redis: any, bounty: any): Promise<boolean> {
  try {
    const rewardAmount = bounty.reward || 0;
    
    await redis.set(`bounty:${bounty.id}`, JSON.stringify({
      ...bounty,
      status: 'settled',
      resultUrl: 'AI executed task automatically',
      paidAmountUsdc: rewardAmount,
      settledAt: Math.floor(Date.now() / 1000),
    }));

    console.log(`[auto-worker] Settled bounty ${bounty.id}`);
    return true;
  } catch (e) {
    console.error('[auto-worker] settleBounty error:', e);
    return false;
  }
}

async function executeTask(bounty: any): Promise<string> {
  const groq = await getGroq();
  if (!groq) {
    return '[No Groq configured]';
  }

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: 'You are an AI task executor. Complete the task professionally and provide the result.' },
        { role: 'user', content: bounty.task },
      ],
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || '[execution failed]';
  } catch (e) {
    console.error('[auto-worker] executeTask error:', e);
    return '[execution error]';
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log('[auto-worker] Starting run');

  try {
    const redis = await getRedis();
    if (!redis) {
      return NextResponse.json({ error: 'Redis not configured' }, { status: 500 });
    }

    const groq = await getGroq();
    const openBounties = await getBounties(redis, 'open');
    const assignedBounties = await getBounties(redis, 'assigned');
    
    console.log(`[auto-worker] Open: ${openBounties.length}, Assigned: ${assignedBounties.length}`);
    
    if (openBounties.length === 0 && assignedBounties.length === 0) {
      return NextResponse.json({
        success: true,
        duration: `${Date.now() - startTime}ms`,
        results: { evaluated: 0, bid: 0, executed: 0, settled: 0 }
      });
    }

    const results = {
      evaluated: 0,
      bid: 0,
      skippedAlreadyBid: 0,
      executed: 0,
      settled: 0,
      errors: 0,
    };

    for (const bounty of openBounties) {
      results.evaluated++;
      console.log(`[auto-worker] Evaluating: ${bounty.id} - ${bounty.task}`);

      if (await alreadyBid(bounty.id, WORKER_FID)) {
        results.skippedAlreadyBid++;
        console.log(`[auto-worker] Already bid, skipping`);
        continue;
      }

      const evaluation = await evaluateWithAI(bounty, groq);
      console.log(`[auto-worker] AI Decision: ${evaluation.shouldBid ? 'BID' : 'SKIP'} - ${evaluation.reason}`);
      
      if (!evaluation.shouldBid) {
        results.skippedAlreadyBid++;
        continue;
      }

      const submitted = await submitBid(redis, bounty);
      if (submitted) {
        results.bid++;
        console.log(`[auto-worker] Bid submitted for ${bounty.id} - ${evaluation.reason}`);
        
        await acceptBid(redis, bounty.id, WORKER_FID, WORKER_USERNAME);
        console.log(`[auto-worker] Auto-accepted bid for ${bounty.id}`);
      } else {
        results.errors++;
      }
    }

    for (const bounty of assignedBounties) {
      if (bounty.workerFid === WORKER_FID) {
        console.log(`[auto-worker] Executing: ${bounty.id}`);
        results.executed++;
        
        const result = await executeTask(bounty);
        await settleBounty(redis, bounty);
        results.settled++;
        console.log(`[auto-worker] Settled: ${bounty.id}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[auto-worker] Completed in ${duration}ms`, results);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      results,
    });
  } catch (error) {
    console.error('[auto-worker] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    workerFid: WORKER_FID,
    workerUsername: WORKER_USERNAME,
    hasGroq: !!GROQ_API_KEY,
  });
}