import { PrivyClient } from '@privy-io/server-auth';

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
);

export async function createAgentWallet(agentId: string): Promise<string> {
  try {
    const wallet = await privy.createWallets({
      chain: 'ethereum',
    });
    const address = wallet.address as string;
    console.log(`Agent ${agentId} wallet created: ${address}`);
    return address;
  } catch (error) {
    console.error(`Failed to create wallet for ${agentId}:`, error);
    throw error;
  }
}

export async function sendFromAgentWallet(params: {
  walletAddress: string;
  to: string;
  data: `0x${string}`;
  value?: bigint;
}) {
  try {
    return await privy.walletApi.ethereum.sendTransaction({
      walletAddress: params.walletAddress,
      caip2: 'eip155:8453',
      transaction: {
        to: params.to,
        data: params.data,
        value: params.value ? params.value.toString() : '0',
      },
    });
  } catch (error) {
    console.error('Failed to send transaction:', error);
    throw error;
  }
}

export async function getWalletBalance(walletAddress: string): Promise<string> {
  try {
    const balance = await privy.walletApi.ethereum.getBalance({
      address: walletAddress,
      caip2: 'eip155:8453',
    });
    return balance.toString();
  } catch (error) {
    console.error('Failed to get balance:', error);
    throw error;
  }
}
