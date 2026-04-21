import { publishCast, type Cast } from '../core/neynar';
import { saveBounty, updateBountyStatus, logActivity, type Bounty } from '../core/redis';

const SIGNER_UUID = process.env.BOUNTY_POSTER_SIGNER_UUID || '';
const BOUNTY_BOARD_FID = process.env.BOUNTY_POSTER_FID || 0;

export interface BountyParams {
  id: string;
  taskDescription: string;
  taskType: 'translate' | 'summarize' | 'onchain-lookup' | 'custom';
  rewardUsdc: number;
  deadline: string; // ISO string or human readable
}

export async function createBounty(params: BountyParams): Promise<string | null> {
  if (!SIGNER_UUID) {
    console.log('[bounty-poster] No signer configured');
    return null;
  }

     // Link to the mini app root (the bounty board) since we don't have a single bounty view page yet
     const bountyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/app`;
     const encodedUrl = encodeURIComponent(bountyUrl);
     const miniAppLink = `fc://miniapp/${encodedUrl}`;

      const castText = [
        `NEW BOUNTY | ${params.taskDescription}`,
        `reward: ${params.rewardUsdc} USDC`,
        `type: ${params.taskType}`,
        `deadline: ${params.deadline}`,
        `link: ${miniAppLink}`,
      ].join(' | ');

  const hash = await publishCast(SIGNER_UUID, castText);

  const bounty: Bounty = {
    id: params.id,
    taskDescription: params.taskDescription,
    taskType: params.taskType,
    rewardUsdc: params.rewardUsdc,
    status: 'open',
    castHash: hash,
    createdAt: Date.now(),
  };

  await saveBounty(bounty);
  await logActivity({
    type: 'bounty_created',
    bountyId: params.id,
    description: `BOUNTY CREATED: ${params.id} - ${params.taskDescription}`,
  });

  console.log(`[bounty-poster] Created bounty ${params.id}`);
  return hash;
}

export async function assignWinner(bountyId: string, winnerFid: number, winnerUsername: string): Promise<void> {
  if (!SIGNER_UUID) return;

  const castText = [
    `ASSIGNED | bounty: ${bountyId}`,
    `winner: @${winnerUsername}`,
    `execute task and reply with RESULT | bounty: ${bountyId} | payment: @abb`,
  ].join(' | ');

  await publishCast(SIGNER_UUID, castText);
  await updateBountyStatus(bountyId, 'assigned', { winnerFid });

  await logActivity({
    type: 'bounty_assigned',
    bountyId,
    description: `ASSIGNED: ${bountyId} to @${winnerUsername}`,
  });
}

export async function settleBounty(
  bountyId: string,
  amountUsdc: number,
  winnerUsername: string,
  txHash?: string
): Promise<void> {
  if (!SIGNER_UUID) return;

  const parts = [
    `SETTLED | bounty: ${bountyId}`,
    `paid: ${amountUsdc} USDC`,
    `agent: @${winnerUsername} earned this`,
  ];
  
  if (txHash) {
    parts.push(`tx: ${txHash}`);
  }

  await publishCast(SIGNER_UUID, parts.join(' | '));
  await updateBountyStatus(bountyId, 'settled');

  await logActivity({
    type: 'bounty_settled',
    bountyId,
    description: `SETTLED: ${bountyId} - ${amountUsdc} USDC paid`,
  });
}

export function parseBountyCast(text: string): BountyParams | null {
  if (!text.startsWith('BOUNTY |')) return null;

  try {
    const parts = text.slice(9).split('|').map(s => s.trim());
    const result: Partial<BountyParams> = {};

    for (const part of parts) {
      const colonIdx = part.indexOf(':');
      if (colonIdx === -1) continue;
      
      const key = part.slice(0, colonIdx).trim();
      const value = part.slice(colonIdx + 1).trim();

      if (key === 'id') result.id = value;
      if (key === 'task') result.taskDescription = value;
      if (key === 'type') result.taskType = value as BountyParams['taskType'];
      if (key === 'reward') {
        const num = parseFloat(value.replace(' USDC', ''));
        if (!isNaN(num)) result.rewardUsdc = num;
      }
    }

    if (!result.id || !result.taskDescription || !result.taskType || !result.rewardUsdc) {
      return null;
    }

    return result as BountyParams;
  } catch {
    return null;
  }
}