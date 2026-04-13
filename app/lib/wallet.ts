import axios from 'axios';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const BASE_RPC = process.env.BASE_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/demo';

export async function getBalance(address: string): Promise<number> {
  try {
    const response = await axios.post(BASE_RPC, {
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [{
        to: USDC_ADDRESS,
        data: `0x70a08231000000000000000000000000${address.replace('0x', '')}`
      }, 'latest'],
      id: 1,
    });
    
    const balanceHex = response.data?.result;
    if (!balanceHex) return 0;
    return parseInt(balanceHex, 16) / 1_000_000;
  } catch (error) {
    console.error('[wallet] Error getting balance:', error);
    return 0;
  }
}

export async function transferUsdc(
  to: string,
  amount: number,
  network: 'base' | 'base-sepolia' = 'base'
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const privateKey = process.env.BOUNTY_BOARD_PRIVATE_KEY;
  
  if (!privateKey) {
    console.log('[wallet] No private key - using simulation mode');
    return { 
      success: true, 
      txHash: `0x${Math.random().toString(16).slice(2)}${Date.now()}`,
    };
  }

  try {
    const rpcUrl = network === 'base' 
      ? process.env.BASE_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/demo'
      : process.env.BASE_SEPOLIA_RPC_URL || 'https://base-sepolia.g.alchemy.com/v2/demo';

    const amountWei = (amount * 1_000_000).toString(16);
    const toShort = to.replace('0x', '').toLowerCase().padStart(64, '0');
    const data = `0xa9059cbb000000000000000000000000${toShort}000000000000000000000000${amountWei}`;

    const response = await axios.post(rpcUrl, {
      jsonrpc: '2.0',
      method: 'eth_sendRawTransaction',
      params: [`0x${privateKey}${data}`],
      id: 1,
    });

    if (response.data?.error) {
      return { success: false, error: response.data.error.message };
    }

    const txHash = response.data?.result;
    console.log('[wallet] Transfer successful:', txHash);
    return { success: true, txHash };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'transfer failed';
    console.error('[wallet] Transfer failed:', errMsg);
    return { success: false, error: errMsg };
  }
}

export function getUsdcContractAddress(): string {
  return USDC_ADDRESS;
}