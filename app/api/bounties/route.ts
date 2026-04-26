import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

const MINIAPP_URL = 'https://abb-five-umber.vercel.app';
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

function getRedisConfig() {
  return {
    url: process.env.UPSTASH_REDIS_REST_URL?.trim(),
    token: process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  };
}

async function getBalanceFromChain(address: string): Promise<number> {
  try {
    const axios = (await import('axios')).default;
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL;
    
    if (!rpcUrl) {
      console.log('[wallet] No RPC URL configured');
      return 0;
    }
    
    const response = await axios.post(rpcUrl, {
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [{
        to: USDC_ADDRESS,
        data: `0x70a08231000000000000000000000000${address.replace('0x', '')}`
      }, 'latest'],
      id: 1,
    }, { timeout: 10000 });
    
    const balanceHex = response.data?.result;
    if (!balanceHex || balanceHex === '0x') return 0;
    return parseInt(balanceHex, 16) / 1_000_000;
  } catch (error) {
    console.error('[wallet] Error getting balance:', error);
    return 0;
  }
}

async function postCastToFarcaster(text: string): Promise<{hash: string | null, error?: string}> {
  let neynarApiKey = process.env.NEYNAR_API_KEY || '';
  const signerUuid = process.env.BOUNTY_POSTER_SIGNER_UUID || '';
  
  neynarApiKey = neynarApiKey.replace(/[^\x20-\x7E]/g, '').trim();
  
  if (!neynarApiKey || !signerUuid) {
    return { hash: null, error: 'Missing NEYNAR_API_KEY or BOUNTY_POSTER_SIGNER_UUID' };
  }
  
  try {
    const axios = (await import('axios')).default;
    
    const response = await axios.post(
      'https://api.neynar.com/v2/cast',
      {
        signer_uuid: signerUuid,
        text: text,
      },
      { headers: { 'x-api-key': neynarApiKey } }
    );
    
    if (response.data?.hash) {
      return { hash: response.data.hash };
    } else {
      return { hash: null, error: response.data?.message || 'No hash returned' };
    }
  } catch (error: any) {
    return { hash: null, error: error.response?.data?.message || error.message || String(error) };
  }
}

export async function GET() {
  try {
    const config = getRedisConfig();
    const redisUrl = config.url?.trim() || '';
    const redisToken = config.token?.trim() || '';

    if (!redisUrl || !redisToken) {
      return NextResponse.json({ error: 'Redis not configured' }, { status: 503 });
    }
    
    const redis = new Redis({ url: redisUrl, token: redisToken });
    
    const bountyIds = await redis.smembers('bounties:all');
    const bountyIdsArray = Array.isArray(bountyIds) ? bountyIds : [];
    
    if (bountyIdsArray.length === 0) {
      return NextResponse.json({ bounties: [], activities: [], source: 'redis' });
    }
    
    const bounties: any[] = [];
    for (const bountyId of bountyIdsArray) {
      const data = await redis.get('bounty:' + bountyId);
      if (data) {
        if (typeof data === 'object') {
          bounties.push(data as any);
        } else {
          try {
            bounties.push(JSON.parse(data as string));
          } catch { /* skip */ }
        }
      }
    }
    
    const activityData = await redis.lrange('activities:recent', 0, 19);
    const activities: any[] = [];
    if (activityData && Array.isArray(activityData)) {
      for (const item of activityData) {
        if (typeof item === 'object') {
          activities.push(item as any);
        } else {
          try {
            activities.push(JSON.parse(item as string));
          } catch { /* skip */ }
        }
      }
    }
    
    bounties.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    return NextResponse.json({ bounties, activities, source: 'redis' });
  } catch (error: any) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: String(error.message) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskDescription, taskType, rewardUsdc, deadlineHours, posterFid, posterUsername } = body;

    if (!taskDescription || !taskType || !rewardUsdc || !deadlineHours) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const fidNum = posterFid || 0;
    const config = getRedisConfig();
    const redisUrl = config.url?.trim() || '';
    const redisToken = config.token?.trim() || '';
    
    if (!redisUrl || !redisToken) {
      return NextResponse.json({ error: 'Redis not configured' }, { status: 503 });
    }

    const redis = new Redis({ url: redisUrl, token: redisToken });
    
    let walletAddress: string | null = null;
    let balance = 0;
    
    if (fidNum > 0) {
      walletAddress = await redis.get(`privy_wallet:${fidNum}`);
      
      if (walletAddress) {
        balance = await getBalanceFromChain(walletAddress);
      }
    }
    
    if (balance < rewardUsdc) {
      return NextResponse.json({
        requiresFunding: true,
        currentBalance: balance,
        requiredAmount: rewardUsdc,
        walletAddress: walletAddress,
        message: `Insufficient balance. You have ${balance.toFixed(2)} USDC but need ${rewardUsdc} USDC. Please fund your wallet first.`,
        instructions: [
          '1. Copy your wallet address',
          '2. Go to https://faucet.circle.com/',
          '3. Deposit USDC to Base Sepolia',
          '4. Return and create bounty'
        ]
      }, { status: 402 });
    }

    const { nanoid } = await import('nanoid');
    const id = 'bnt_' + nanoid(8);
    
    const newBounty: any = {
      id: id,
      task: taskDescription,
      type: taskType,
      reward: rewardUsdc,
      status: 'open',
      posterUsername: posterUsername || 'anonymous',
      posterFid: posterFid || 0,
      posterWallet: walletAddress || '',
      deadlineTs: Math.floor(Date.now() / 1000) + deadlineHours * 3600,
      createdAt: Math.floor(Date.now() / 1000),
      castHash: ''
    };

    const key = 'bounty:' + id;
    await redis.set(key, JSON.stringify(newBounty));
    await redis.sadd('bounties:all', id);
    await redis.sadd('bounties:open', id);
    
    const verifyData = await redis.get(key);
    
    const castText = [
      `BOUNTY | id: ${id}`,
      `task: ${taskDescription}`,
      `type: ${taskType}`,
      `reward: ${rewardUsdc} USDC`,
    ].join(' | ');
    
    console.log('[bounties] About to post cast:', castText);
    
    const castResult = await postCastToFarcaster(castText);
    const castHash = castResult.hash;
    
    const bountyLink = `${MINIAPP_URL}/bounties/${id}`;
    const neynarApiKey = process.env.NEYNAR_API_KEY;
    
    if (castHash) {
      newBounty.castHash = castHash;
      await redis.set(key, JSON.stringify(newBounty));
      console.log('[bounties] Cast posted with hash:', castHash);
    } else {
      console.log('[bounties] Cast not posted, error:', castResult.error);
    }
    
    return NextResponse.json({
      bounty: newBounty,
      verify: !!verifyData,
      castPosted: !!castHash,
      castHash: castHash,
      castError: castResult.error,
      bountyLink: bountyLink,
      debug: {
        hasApiKey: !!neynarApiKey,
        apiKeyPrefix: neynarApiKey?.substring(0, 8) || 'none'
      }
    });
  } catch (error: any) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}