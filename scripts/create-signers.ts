import { randomBytes } from 'crypto';
import { bytesToHex } from 'viem';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || '';
const MNEMONIC = process.env.FARCASTER_MNEMONIC || '';
const APP_FID = parseInt(process.env.FARCASTER_APP_FID || '0');

interface SignerResult {
  signerUuid: string;
  publicKey: string;
  fid: number;
  label: string;
}

async function createMockSigners(): Promise<SignerResult[]> {
  const labelMap = ['BOUNTY POSTER', 'WORKER ALPHA', 'WORKER BETA'];
  const signers: SignerResult[] = [];

  for (let i = 0; i < 3; i++) {
    const privateKeyBytes = randomBytes(32);
    const publicKeyBytes = randomBytes(32);
    
    signers.push({
      signerUuid: `mock_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
      publicKey: bytesToHex(publicKeyBytes),
      fid: APP_FID || 12345,
      label: labelMap[i],
    });
  }

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           MOCK SIGNERS GENERATED (Development)               ║
╚══════════════════════════════════════════════════════════════╝

⚠️  Warning: These are MOCK signers for development only!
    - They will NOT work on actual Farcaster
    - Use for local testing and miniapp development
    - For production, you need a paid Neynar plan

📝 To get real signers:
   1. Go to https://neynar.com
   2. Upgrade to a paid plan (~$29/month)
   3. Run: pnpm create-signers --real
  `);

  return signers;
}

async function createRealSigners(): Promise<SignerResult[]> {
  if (!NEYNAR_API_KEY) {
    console.error('❌ NEYNAR_API_KEY is required for real signers');
    console.log('   Get one at: https://neynar.com');
    process.exit(1);
  }

  if (!MNEMONIC || !APP_FID) {
    console.error('❌ FARCASTER_MNEMONIC and FARCASTER_APP_FID are required');
    console.log(`
   Please set these in your .env.local:
   
   FARCASTER_MNEMONIC="your 12-word seed phrase"  
   FARCASTER_APP_FID=your_fid_number
   
   Get your FID from: https://farcaster.xyz/~/_/settings
    `);
    process.exit(1);
  }

  const { mnemonicToAccount } = await import('viem/accounts');
  const axios = await import('axios');

  async function generateEd25519Keypair() {
    const privateKeyBytes = randomBytes(32);
    const publicKeyBytes = randomBytes(32);
    return {
      privateKey: bytesToHex(privateKeyBytes),
      publicKey: bytesToHex(publicKeyBytes),
    };
  }

  async function createSignerWithNeynar(label: string): Promise<SignerResult> {
    console.log(`\n🔄 Creating ${label} signer via Neynar...`);
    
    const keypair = await generateEd25519Keypair();
    console.log(`   Generated keypair`);
    
    const createResponse = await axios.default.post(
      'https://api.neynar.com/v2/farcaster/signer',
      {},
      { headers: { api_key: NEYNAR_API_KEY } }
    );
    
    const { signer_uuid, public_key: neynarPublicKey } = createResponse.data.result;
    console.log(`   Created signer: ${signer_uuid}`);
    
    const account = mnemonicToAccount(MNEMONIC);
    const deadline = Math.floor(Date.now() / 1000) + 86400;
    
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
        requestFid: BigInt(APP_FID),
        key: neynarPublicKey,
        deadline: BigInt(deadline),
      },
    });
    
    console.log(`   Signed with wallet`);
    
    const registerResponse = await axios.default.post(
      `https://api.neynar.com/v2/farcaster/signer/signed_key?api_key=${NEYNAR_API_KEY}`,
      {
        signer_uuid,
        signature,
        app_fid: APP_FID,
        deadline,
      }
    );
    
    const { approval_url } = registerResponse.data.result;
    console.log(`\n📱 APPROVAL REQUIRED FOR ${label}:`);
    console.log(`   ${approval_url}`);
    
    console.log(`\n⏳ Waiting for approval...`);
    
    while (true) {
      await new Promise(r => setTimeout(r, 3000));
      
      const statusResponse = await axios.default.get(
        `https://api.neynar.com/v2/farcaster/signer?signer_uuid=${signer_uuid}&api_key=${NEYNAR_API_KEY}`
      );
      
      const status = statusResponse.data.result.status;
      console.log(`   Status: ${status}`);
      
      if (status === 'approved') {
        console.log(`\n✅ ${label} signer approved!`);
        return {
          signerUuid: signer_uuid,
          publicKey: neynarPublicKey,
          fid: APP_FID,
          label,
        };
      }
      
      if (status === 'revoked' || status === 'failed') {
        throw new Error(`Signer ${status}`);
      }
    }
  }

  const labelMap = ['BOUNTY POSTER', 'WORKER ALPHA', 'WORKER BETA'];
  const signers: SignerResult[] = [];

  try {
    for (const label of labelMap) {
      const signer = await createSignerWithNeynar(label);
      signers.push(signer);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  return signers;
}

async function main() {
  const useMock = !process.argv.includes('--real');
  
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           ABB - Farcaster Signer Creator                   ║
╚══════════════════════════════════════════════════════════════╝
  `);

  const signers = useMock 
    ? await createMockSigners() 
    : await createRealSigners();

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
  FID:        ${signer.fid}
    `);
  }

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              ADD TO .env.local                           ║
╚══════════════════════════════════════════════════════╝

BOUNTY_POSTER_SIGNER_UUID=${signers[0].signerUuid}
BOUNTY_POSTER_FID=${signers[0].fid}
WORKER_ALPHA_SIGNER_UUID=${signers[1].signerUuid}
WORKER_ALPHA_FID=${signers[1].fid}
WORKER_BETA_SIGNER_UUID=${signers[2].signerUuid}
WORKER_BETA_FID=${signers[2].fid}
  `);
}

main().catch(console.error);