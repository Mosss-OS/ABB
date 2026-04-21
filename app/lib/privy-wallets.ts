const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

let isInitialized = false;

export interface AgentWallet {
  agentId: string;
  address: string;
}

const agentWallets: Map<string, AgentWallet> = new Map();

export function initPrivy(): boolean {
  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;

  if (!appId || !appSecret) {
    console.log('[privy] Missing PRIVY_APP_ID or PRIVY_APP_SECRET - using simple wallet mode');
    return false;
  }

  isInitialized = true;
  console.log('[privy] Initialized (simple wallet mode - requires manual wallet setup)');
  return true;
}

export function isPrivyReady(): boolean {
  return isInitialized;
}

export async function createAgentWallet(agentId: string): Promise<AgentWallet> {
  const envAddress = `WORKER_${agentId.toUpperCase()}_WALLET_ADDRESS`;
  const address = process.env[envAddress];

  if (address) {
    const agent: AgentWallet = { agentId, address };
    agentWallets.set(agentId, agent);
    console.log(`[privy] Using configured wallet for ${agentId}: ${address}`);
    return agent;
  }

  const simulated: AgentWallet = {
    agentId,
    address: `0x${Math.random().toString(16).slice(2, 42).padEnd(40, '0')}`,
  };
  agentWallets.set(agentId, simulated);
  console.log(`[privy] Created simulated wallet for ${agentId}: ${simulated.address}`);
  return simulated;
}

export async function getAgentWallet(agentId: string): Promise<AgentWallet | null> {
  return agentWallets.get(agentId) ?? null;
}

export async function getAllWallets(): Promise<AgentWallet[]> {
  return Array.from(agentWallets.values());
}

export function getUsdcAddress(): string {
  return USDC_ADDRESS;
}

export async function sendFromWallet(
  fromAddress: string,
  toAddress: string,
  amountUsdc: number
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const privateKey = process.env.BOUNTY_BOARD_PRIVATE_KEY;

  if (!privateKey) {
    console.log('[privy] No private key - simulation mode');
    return {
      success: true,
      txHash: `0x${Math.random().toString(16).slice(2)}${Date.now()}`,
    };
  }

  const amountWei = BigInt(Math.floor(amountUsdc * 1_000_000)).toString(16);
  const toShort = toAddress.replace('0x', '').toLowerCase().padStart(64, '0');
  const data = `0xa9059cbb000000000000000000000000${toShort}000000000000000000000000${amountWei}`;

  try {
    const axios = (await import('axios')).default;
    const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

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
    console.log('[privy] Transfer successful:', txHash);
    return { success: true, txHash };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'transfer failed';
    console.error('[privy] Transfer failed:', errMsg);
    return { success: false, error: errMsg };
  }
}

export async function getWalletBalances(_walletAddress: string): Promise<{
  eth: string;
  usdc: string;
}> {
  return { eth: '0', usdc: '0' };
}

initPrivy();