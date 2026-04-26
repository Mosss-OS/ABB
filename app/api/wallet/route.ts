import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

function getRedisConfig() {
  return {
    url: process.env.UPSTASH_REDIS_REST_URL?.trim(),
    token: process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  };
}

function deriveWalletAddress(fid: number): string {
  const seed = `user_${fid}_wallet`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  return '0x' + Math.abs(hash).toString(16).padStart(40, '0').slice(-40);
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get('fid');
  
  if (!fid) {
    return NextResponse.json({ error: 'fid required' }, { status: 400 });
  }
  
  const fidNum = parseInt(fid, 10);
  if (isNaN(fidNum)) {
    return NextResponse.json({ error: 'invalid fid' }, { status: 400 });
  }
  
  const config = getRedisConfig();
  let walletAddress: string | null = null;
  
  if (config.url && config.token) {
    const redis = new Redis({ url: config.url, token: config.token });
    walletAddress = await redis.get(`privy_wallet:${fidNum}`);
  }
  
  if (!walletAddress) {
    walletAddress = deriveWalletAddress(fidNum);
  }
  
  const balance = await getBalanceFromChain(walletAddress);
  
  let depositedUsdc = 0;
  if (config.url && config.token) {
    const redis = new Redis({ url: config.url, token: config.token });
    const depositRecord = await redis.hget(`user:${fidNum}`, 'depositedUsdc');
    depositedUsdc = typeof depositRecord === 'number' ? depositRecord : 0;
  }
  
  return NextResponse.json({
    fid: fidNum,
    address: walletAddress,
    balance,
    depositedUsdc,
    network: 'base-sepolia',
    token: 'USDC',
    depositToken: USDC_ADDRESS,
  });
}