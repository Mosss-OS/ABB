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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fid, username } = body;

    if (!fid) {
      return NextResponse.json({ error: 'fid required' }, { status: 400 });
    }

    const fidNum = parseInt(fid, 10);
    
    // Check if user already has a Privy wallet
    const redisConfig = getRedisConfig();
    let existingWallet = null;
    
    if (redisConfig.url && redisConfig.token) {
      const redis = new Redis({ url: redisConfig.url, token: redisConfig.token });
      existingWallet = await redis.get(`privy_wallet:${fidNum}`);
    }

    let walletAddress = existingWallet;
    
    // If no existing wallet, create one via Privy API
    if (!walletAddress && APP_ID && APP_SECRET) {
      try {
        // Create wallet via Privy API
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
        
        if (data.wallet?.address) {
          walletAddress = data.wallet.address;
          
          // Save to Redis
          if (redisConfig.url && redisConfig.token) {
            const redis = new Redis({ url: redisConfig.url, token: redisConfig.token });
            await redis.set(`privy_wallet:${fidNum}`, walletAddress);
            await redis.hset(`user:${fidNum}`, {
              privyWallet: walletAddress,
              username: username || '',
            });
          }
        }
      } catch (e) {
        console.error('[privy] Error creating wallet:', e);
      }
    }

    // Get balance from chain
    let balance = 0;
    const walletAddressStr = walletAddress as string;
    if (walletAddressStr) {
      try {
        const axios = (await import('axios')).default;
        const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL;
        
        if (rpcUrl) {
          const response = await axios.post(rpcUrl, {
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{
              to: USDC_ADDRESS,
              data: `0x70a08231000000000000000000000000${walletAddressStr.replace('0x', '')}`
            }, 'latest'],
            id: 1,
          }, { timeout: 10000 });

          const balanceHex = response.data?.result;
          if (balanceHex && balanceHex !== '0x') {
            balance = parseInt(balanceHex, 16) / 1_000_000;
          }
        }
      } catch (e) {
        console.error('[wallet] Error getting balance:', e);
      }
    }

    return NextResponse.json({
      fid: fidNum,
      address: walletAddress,
      isPrivyWallet: true,
      balance,
      network: 'base-sepolia',
      token: 'USDC',
    });
  } catch (error) {
    console.error('[privy-login] Error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}