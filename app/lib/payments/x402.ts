import { transferUsdc, getBalance, getUsdcContractAddress } from '../wallet';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const BASE_CHAIN_ID = 8453;
const BASE_SEPOLIA_CHAIN_ID = 84532;

export interface PaymentConfig {
  network: 'base' | 'base-sepolia';
  facilitatorUrl?: string;
  bountyBoardAddress: string;
}

let paymentConfig: PaymentConfig | null = null;

export function initPayment(config: PaymentConfig): { isEnabled: boolean } {
  paymentConfig = config;
  
  if (!config.bountyBoardAddress) {
    console.log('[x402] Payment disabled - no bounty board address configured');
    return { isEnabled: false };
  }

  console.log('[x402] Initialized:', config.network);
  return { isEnabled: true };
}

export async function payBountyWinner(
  winnerAddress: string,
  amountUsdc: number,
  bountyId: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  if (!paymentConfig?.bountyBoardAddress) {
    return { success: false, error: 'Payment system not configured' };
  }

  try {
    console.log(`[x402] Paying ${amountUsdc} USDC to ${winnerAddress} for bounty ${bountyId}`);

    const result = await transferUsdc(
      winnerAddress,
      amountUsdc,
      paymentConfig.network
    );

    if (result.success) {
      console.log(`[x402] Payment successful: ${result.txHash}`);
    }
    
    return result;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'unknown error';
    console.error(`[x402] Payment failed:`, errMsg);
    return { success: false, error: errMsg };
  }
}

export async function getPaymentBalance(_network?: 'base' | 'base-sepolia'): Promise<number> {
  return 0;
}

export async function getPaymentRequirements(amountUsdc: number): Promise<{
  address: string;
  amount: string;
  chainId: number;
  token: string;
}> {
  const network = paymentConfig?.network || 'base';
  return {
    address: USDC_ADDRESS,
    amount: (amountUsdc * 1_000_000).toString(),
    chainId: network === 'base' ? BASE_CHAIN_ID : BASE_SEPOLIA_CHAIN_ID,
    token: 'USDC',
  };
}

export function getUsdcAddress(): string {
  return USDC_ADDRESS;
}

export function getChainId(network: 'base' | 'base-sepolia'): number {
  return network === 'base' ? BASE_CHAIN_ID : BASE_SEPOLIA_CHAIN_ID;
}

export function isPaymentEnabled(): boolean {
  return paymentConfig?.bountyBoardAddress !== undefined && paymentConfig?.bountyBoardAddress !== '';
}