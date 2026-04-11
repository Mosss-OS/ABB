import { randomBytes } from 'crypto';
import { bytesToHex } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import axios from 'axios';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || 'F56A0E42-1152-4DBF-8309-C4FD565A6CCD';

async function generateEd25519Keypair() {
  const privateKeyBytes = randomBytes(32);
  const publicKeyBytes = randomBytes(32);
  return {
    privateKey: bytesToHex(privateKeyBytes),
    publicKey: bytesToHex(publicKeyBytes),
  };
}

async function createSignerWithNeynar(mnemonic: string, appFid: number, label: string) {
  console.log(`\n🔄 Creating ${label} signer via Neynar...`);
  
  // Step 1: Generate keypair
  const keypair = await generateEd25519Keypair();
  console.log(`   Generated keypair`);
  
  // Step 2: Create signer via Neynar API
  const createResponse = await axios.post(
    'https://api.neynar.com/v2/farcaster/signer',
    {},
    { headers: { api_key: NEYNAR_API_KEY } }
  );
  
  const { signer_uuid, public_key: neynarPublicKey } = createResponse.data.result;
  console.log(`   Created signer: ${signer_uuid}`);
  
  // Step 3: Sign the key request with your wallet
  const account = mnemonicToAccount(mnemonic);
  
  const deadline = Math.floor(Date.now() / 1000) + 86400;
  
  // EIP-712 signature for Farster
  const signature = await account.signTypedData({
    domain: {
      name: 'Farcaster SignedKeyRequestValidator',
      version: '1',
      chainId: 1,
      verifyingContract: '0x00000000fc700472606ed4fa22623acf62c60553',
    },
    types: {
      SignedKeyRequest: [
        { name: 'requestFid', type: 'uint256' },
        { name: 'key', type: 'bytes' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    primaryType: 'SignedKeyRequest',
    message: {
      requestFid: BigInt(appFid),
      key: neynarPublicKey,
      deadline: BigInt(deadline),
    },
  });
  
  console.log(`   Signed with wallet`);
  
  // Step 4: Register the signed key
  const registerResponse = await axios.post(
    `https://api.neynar.com/v2/farcaster/signer/signed_key?api_key=${NEYNAR_API_KEY}`,
    {
      signer_uuid,
      signature,
      app_fid: appFid,
      deadline,
    }
  );
  
  const { approval_url } = registerResponse.data.result;
  console.log(`   Registered, got approval URL`);
  
  console.log(`\n📱 APPROVAL REQUIRED FOR ${label}:`);
  console.log(`   ${approval_url}`);
  
  // Step 5: Poll for approval
  console.log(`\n⏳ Waiting for approval...`);
  
  while (true) {
    await new Promise(r => setTimeout(r, 3000));
    
    const statusResponse = await axios.get(
      `https://api.neynar.com/v2/farcaster/signer?signer_uuid=${signer_uuid}&api_key=${NEYNAR_API_KEY}`
    );
    
    const status = statusResponse.data.result.status;
    console.log(`   Status: ${status}`);
    
    if (status === 'approved') {
      console.log(`\n✅ ${label} signer approved!`);
      return {
        signerUuid: signer_uuid,
        publicKey: neynarPublicKey,
        privateKey: keypair.privateKey,
        fid: appFid,
        label,
      };
    }
    
    if (status === 'revoked' || status === 'failed') {
      throw new Error(`Signer ${status}`);
    }
  }
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           ABB - Farster Signer Creator (via Neynar)        ║
╚══════════════════════════════════════════════════════════════╝
  `);
  
  const MNEMONIC = process.env.FARCASTER_MNEMONIC;
  const APP_FID = parseInt(process.env.FARCASTER_APP_FID || '0');
  
  if (!MNEMONIC || !APP_FID) {
    console.log(`
⚠️  Missing required environment variables!

Please set these in your .env.local:

FARCASTER_MNEMONIC="your 12-word seed phrase"  
FARCASTER_APP_FID=your_fid_number

Example:
FARCASTER_MNEMONIC="word1 word2 word3 ... word12"
FARCASTER_APP_FID=12345

Get your FID from: https://farcaster.xyz/~/_/settings
    `);
    process.exit(1);
  }
  
  const account = mnemonicToAccount(MNEMONIC);
  console.log(`   Account: ${account.address}`);
  console.log(`   FID: ${APP_FID}`);
  
  const signers = [];
  
  try {
    const bountyPoster = await createSignerWithNeynar(MNEMONIC, APP_FID, 'BOUNTY POSTER');
    signers.push(bountyPoster);
    
    const workerAlpha = await createSignerWithNeynar(MNEMONIC, APP_FID, 'WORKER ALPHA');
    signers.push(workerAlpha);
    
    const workerBeta = await createSignerWithNeynar(MNEMONIC, APP_FID, 'WORKER BETA');
    signers.push(workerBeta);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
  
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   SIGNERS CREATED!                         ║
╚══════════════════════════════════════════════════════════════╝
  `);
  
  for (const signer of signers) {
    console.log(`
${signer.label}:
  SIGNER_UUID: ${signer.signerUuid}
  PUBLIC_KEY:  ${signer.publicKey}
  FID:         ${signer.fid}
    `);
  }
  
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              ADD TO .env.local                           ║
╚══════════════════════════════════════════════════════════════╝

BOUNTY_POSTER_SIGNER_UUID=${signers[0].signerUuid}
BOUNTY_POSTER_FID=${signers[0].fid}
WORKER_ALPHA_SIGNER_UUID=${signers[1].signerUuid}
WORKER_ALPHA_FID=${signers[1].fid}
WORKER_BETA_SIGNER_UUID=${signers[2].signerUuid}
WORKER_BETA_FID=${signers[2].fid}

⚠️  Save these values!
    `);
}

main().catch(console.error);