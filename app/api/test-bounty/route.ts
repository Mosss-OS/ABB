import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

function getRedisConfig() {
  return {
    url: process.env.UPSTASH_REDIS_REST_URL?.trim(),
    token: process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  };
}

export async function POST(req: NextRequest) {
  try {
    const redis = new Redis(getRedisConfig());
    const id = `test_${Date.now()}`;
    const task = 'Translate "Hello world" to Spanish - test task';
    
    const bounty = {
      id,
      task,
      type: 'translate',
      reward: 1,
      status: 'open',
      posterUsername: 'testbot',
      posterFid: 999999,
      deadlineTs: Math.floor(Date.now() / 1000) + 3600,
      createdAt: Math.floor(Date.now() / 1000),
      castHash: '',
      bidCount: 0,
    };

    await redis.set(`bounty:${id}`, JSON.stringify(bounty));
    await redis.sadd('bounties:all', id);
    
    return NextResponse.json({ 
      success: true,
      bounty,
      message: 'Test bounty created - now run /api/autonomous' 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}