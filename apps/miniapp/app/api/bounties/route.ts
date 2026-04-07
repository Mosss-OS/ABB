import { NextRequest, NextResponse } from 'next/server';
import { createBounty } from '../../../../bots/src/core/cast-handler';

export async function GET() {
  try {
    const { listAllBounties, getAgentStats, getRecentActivities } = await import('../../../../bots/src/core/state');
    const bounties = await listAllBounties();
    const activities = await getRecentActivities();
    return NextResponse.json({ bounties, activities });
  } catch (error) {
    console.error('[api/bounties] GET error:', error);
    return NextResponse.json({ bounties: [], activities: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskDescription, taskType, rewardUsdc, deadlineHours } = body;

    if (!taskDescription || !taskType || !rewardUsdc || !deadlineHours) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const bounty = await createBounty({
      taskDescription,
      taskType,
      rewardUsdc,
      deadlineHours,
    });

    return NextResponse.json({ 
      bounty,
      castHash: bounty.castHash,
    });
  } catch (error) {
    console.error('[api/bounties] POST error:', error);
    return NextResponse.json({ error: 'Failed to create bounty' }, { status: 500 });
  }
}
