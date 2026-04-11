import { createWalletClient, http } from 'viem';
import { privateKeyToAccount, mnemonicToAccount } from 'viem/accounts';
import { optimism } from 'viem/chains';

const MNEMONIC = process.env.CUSTODY_MNEMONIC;

if (!MNEMONIC) {
  console.log(`
⚠️  Missing CUSTODY_MNEMONIC!

To create a Farster account, you need a custody wallet.

Options:
1. Use an existing wallet (add to CUSTODY_MNEMONIC in .env.local)
2. Generate a new one

For now, let's check what we have configured.
  `);
  process.exit(1);
}

const account = mnemonicToAccount(MNEMONIC);

console.log(`
╔══════════════════════════════════════════════════════════════╗
║         ABB - Farster Account Setup                   ║
╚══════════════════════════════════════════════════════════════╝

Custody Address: ${account.address}

⚠️  IMPORTANT: Save this address!
⚠️  You'll need to fund it with some ETH on Optimism for fname registration

NEXT STEPS:
1. Get Clawcaster API key: https://clawcaster.com/gateway
2. Add to .env.local: CLAWCASTER_API_KEY=your_key
3. Run: pnpm create-farcaster-account
  `);