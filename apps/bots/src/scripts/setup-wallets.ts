import { createAgentWallet, getWalletBalance } from '../payments/privy-wallets';
import * as fs from 'fs';

const AGENTS = [
  { id: 'bounty-poster', fid: 1234, description: 'Posts bounties, pays workers' },
  { id: 'worker-alpha', fid: 1235, description: 'Worker agent that completes tasks' },
  { id: 'worker-beta', fid: 1236, description: 'Worker agent that completes tasks' },
];

interface WalletInfo {
  address: string;
  balance?: string;
}

async function setupWallets() {
  console.log('='.repeat(50));
  console.log('AGENT WALLET SETUP SCRIPT');
  console.log('='.repeat(50));

  const privyAppId = process.env.PRIVY_APP_ID;
  const privySecret = process.env.PRIVY_APP_SECRET;

  if (!privyAppId || !privySecret) {
    console.error('\n❌ Error: PRIVY_APP_ID and PRIVY_APP_SECRET must be set');
    console.log('\nGet your credentials from https://privy.io');
    console.log('Add to .env.local:');
    console.log('  PRIVY_APP_ID=your_app_id');
    console.log('  PRIVY_APP_SECRET=your_app_secret');
    process.exit(1);
  }

  console.log('\n📋 Agent Configuration:');
  for (const agent of AGENTS) {
    console.log(`  - ${agent.id}: ${agent.description}`);
  }

  const wallets: Record<string, WalletInfo> = {};

  for (const agent of AGENTS) {
    console.log(`\n🔧 Setting up wallet for ${agent.id}...`);
    try {
      const address = await createAgentWallet(agent.id);
      wallets[agent.id] = { address };
      console.log(`  ✅ Address: ${address}`);
    } catch (error) {
      console.error(`  ❌ Failed to create wallet:`, error);
      console.log(`  ⚠️  Skipping ${agent.id}`);
    }
  }

  const successful = Object.keys(wallets);
  if (successful.length > 0) {
    fs.writeFileSync('wallet-addresses.json', JSON.stringify(wallets, null, 2));
    console.log('\n' + '='.repeat(50));
    console.log('✅ WALLETS CREATED');
    console.log('='.repeat(50));
    console.log('\nWallet addresses saved to wallet-addresses.json\n');

    console.log('📝 Add these to your .env.local:');
    for (const agent of AGENTS) {
      if (wallets[agent.id]) {
        const upper = agent.id.toUpperCase().replace(/-/g, '_');
        console.log(`${upper}_WALLET=${wallets[agent.id].address}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('⚠️  CRITICAL: FUND WITH USDC ON BASE');
    console.log('='.repeat(50));
    console.log('\nTo make payments, wallets must be funded with USDC:');
    console.log('1. Get USDC on Base (Sepolia for testnet):');
    console.log('   - Bridge from Ethereum or purchase on exchange');
    console.log('   - Use Base Sepolia faucet if available');
    console.log('\n2. Minimum recommended per wallet:');
    console.log('   - Bounty poster: ~50-100 USDC (for paying workers)');
    console.log('   - Workers: ~5-10 USDC (for gas fees)');
    console.log('\n3. Token address on Base:');
    console.log('   - USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
    console.log('   - USDC (Sepolia): 0xf175520C5246a02aa4d7476d62A87D61EAdadEb');
    console.log('\n4. Check balances with:');
    console.log('   pnpm --filter bots setup-wallets --check');
  } else {
    console.log('\n❌ No wallets created. Check your Privy credentials.');
  }
}

if (process.argv.includes('--check')) {
  console.log('Checking wallet balances...');
  const data = JSON.parse(fs.readFileSync('wallet-addresses.json', 'utf-8'));
  for (const [agentId, info] of Object.entries(data) as [string, WalletInfo][]) {
    try {
      const balance = await getWalletBalance(info.address);
      console.log(`${agentId}: ${balance} ETH/USDC`);
    } catch (e) {
      console.log(`${agentId}: Unable to check balance`);
    }
  }
}

setupWallets().catch(console.error);