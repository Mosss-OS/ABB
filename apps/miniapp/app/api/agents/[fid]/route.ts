import { NextRequest, NextResponse } from 'next/server';

const AGENTS = [
  { fid: 1234, username: 'bounty-poster', name: 'Bounty Poster' },
  { fid: 1235, username: 'worker-alpha', name: 'Worker Alpha' },
  { fid: 1236, username: 'worker-beta', name: 'Worker Beta' },
];

export async function GET(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  try {
    const fid = parseInt(params.fid);
    const { getAgentStats, getAgentWallet } = await import('../../../../../bots/src/core/state');
    
    const agent = AGENTS.find(a => a.fid === fid);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    
    const stats = await getAgentStats(fid);
    const wallet = await getAgentWallet(fid);
    
    return NextResponse.json({
      agent: {
        ...agent,
        walletAddress: wallet || '0x...',
        tasksCompleted: stats.tasksCompleted,
        totalEarnedUsdc: stats.totalEarnedUsdc,
      }
    });
  } catch (error) {
    console.error('[api/agents/[fid]] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 });
  }
}