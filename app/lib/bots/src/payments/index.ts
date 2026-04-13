import { transferUsdc } from '../../../wallet';

export async function payWinner(
  winnerAddress: string,
  amountUsdc: number
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  return transferUsdc(winnerAddress, amountUsdc, 'base');
}

export async function getPaymentStatus(txHash: string): Promise<string> {
  return 'pending';
}