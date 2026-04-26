import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const APP_ID = process.env.PRIVY_APP_ID;
const APP_SECRET = process.env.PRIVY_APP_SECRET;
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fid, username } = body;

    if (!fid) {
      return NextResponse.json({ error: 'fid required' }, { status: 400 });
    }

    const fidNum = parseInt(fid, 10);
    
    const redisConfig = getRedisConfig();
    let existingWallet: string | null = null;
    
    if (redisConfig.url && redisConfig.token) {
      const redis = new Redis({ url: redisConfig.url, token: redisConfig.token });
      existingWallet = await redis.get(`privy_wallet:${fidNum}`) as string | null;
    }

    let walletAddress: string | null = existingWallet;
    
    // Try to create wallet via Privy API if none exists
    if (!walletAddress && APP_ID && APP_SECRET) {
      try {
        console.log('[privy-login] Creating wallet for fid:', fidNum);
        const response = await fetch('https://api.privy.io/v1/wallets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${APP_ID}:${APP_SECRET}`).toString('base64')}`,
          },
          body: JSON.stringify({
            walletRequest: {
              chainType: 'ethereum',
              networks: ['base-sepolia'],
            },
          }),
        });
        
        const data = await response.json();
        console.log('[privy-login] Privy API response:', data);
        
        if (data.wallet?.address) {
          walletAddress = data.wallet.address;
          
          if (redisConfig.url && redisConfig.token) {
            const redis = new Redis({ url: redisConfig.url, token: redisConfig.token });
            await redis.set(`privy_wallet:${fidNum}`, walletAddress);
            await redis.hset(`user:${fidNum}`, {
              privyWallet: walletAddress,
              username: username || '',
            });
          }
        } else {
          console.error('[privy-login] Failed to create wallet:', data);
        }
      } catch (e) {
        console.error('[privy-login] Error creating wallet:', e);
      }
    }
    
    // Fallback: derive a wallet address if Privy failed
    if (!walletAddress) {
      console.log('[privy-login] Using derived wallet address for fid:', fidNum);
      walletAddress = deriveWalletAddress(fidNum);
    }
    
    // Get balance from chain
    let balance = 0;
    if (walletAddress) {
      try {
        const axios = (await import('axios')).default;
        const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL;
        
        if (rpcUrl) {
          const response = await axios.post(rpcUrl, {
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{
              to: USDC_ADDRESS,
              data: `0x70a08231000000000000000000000000${walletAddress.replace('0x', '')}`
            }, 'latest'],
            id: 1,
          }, { timeout: 10000 });
          
          const balanceHex = response.data?.result;
          if (balanceHex && balanceHex !== '0x') {
            balance = parseInt(balanceHex, 16) / 1_000_000;
          }
        }
      } catch (e) {
        console.error('[privy-login] Error getting balance:', e);
      }
    }
    
    return NextResponse.json({
      fid: fidNum,
      address: walletAddress,
      isPrivyWallet: !!existingWallet,
      balance,
      network: 'base-sepolia',
      token: 'USDC',
    });
  } catch (error) {
    console.error('[privy-login] Error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}