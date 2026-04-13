import { publishCast } from '../core/neynar';
import { getBounty, updateBountyStatus, logActivity } from '../core/redis';
import { executeTask } from '../tasks/index';
type TaskType = 'translate' | 'summarize' | 'onchain-lookup' | 'custom';

const SIGNER_UUID = process.env.WORKER_ALPHA_SIGNER_UUID || '';
const WORKER_USERNAME = process.env.WORKER_ALPHA_USERNAME || 'worker-alpha';

export async function bidOnBounty(bountyId: string, eta: string = '2h'): Promise<string | null> {
  if (!SIGNER_UUID) {
    console.log('[worker] No signer configured');
    return null;
  }

  const castText = [
    `BID | bounty: ${bountyId}`,
    `agent: @${WORKER_USERNAME}`,
    `eta: ${eta}`,
    `approach: use Groq AI to execute this task`,
  ].join(' | ');

  const hash = await publishCast(SIGNER_UUID, castText);
  console.log(`[worker] Bid on bounty ${bountyId}`);
  return hash;
}

export async function executeBounty(bountyId: string): Promise<string | null> {
  if (!SIGNER_UUID) return null;

  const bounty = await getBounty(bountyId);
  if (!bounty || bounty.status !== 'assigned') return null;

  const output = await executeTask(bounty.taskDescription, bounty.taskType as TaskType);

  const maxLength = 300;
  const truncated = output.length > maxLength 
    ? output.substring(0, maxLength - 3) + '...' 
    : output;

  const castText = [
    `RESULT | bounty: ${bountyId}`,
    truncated,
    `payment: @abb please release`,
  ].join(' | ');

  const hash = await publishCast(SIGNER_UUID, castText, bounty.castHash);

  await updateBountyStatus(bountyId, 'completed', { 
    winnerAddress: process.env.WORKER_ALPHA_WALLET_ADDRESS 
  });

  await logActivity({
    type: 'task_executed',
    bountyId,
    description: `EXECUTED: ${bountyId} - ${truncated.substring(0, 50)}...`,
  });

  console.log(`[worker] Executed bounty ${bountyId}`);
  return hash;
}

export function parseBidCast(text: string): { bountyId: string; agent: string; eta: string } | null {
  if (!text.startsWith('BID |')) return null;

  try {
    const parts = text.slice(7).split('|').map(s => s.trim());
    const result: any = {};

    for (const part of parts) {
      const colonIdx = part.indexOf(':');
      if (colonIdx === -1) continue;
      
      const key = part.slice(0, colonIdx).trim();
      const value = part.slice(colonIdx + 1).trim();

      if (key === 'bounty') result.bountyId = value;
      if (key === 'agent') result.agent = value;
      if (key === 'eta') result.eta = value;
    }

    if (!result.bountyId || !result.agent) return null;
    return result;
  } catch {
    return null;
  }
}