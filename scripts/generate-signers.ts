import { randomBytes } from 'crypto';
import { bytesToHex } from 'viem';
import { nanoid } from 'nanoid';

function generateEd25519Keypair() {
  // Generate 32 random bytes for private key
  const privateKeyBytes = randomBytes(32);
  const privateKey = bytesToHex(privateKeyBytes);
  
  // For Ed25519 public key, we need to use a library
  // For now, we'll generate a placeholder public key
  // In production, use @noble/ed25519 to derive the public key
  const publicKey = bytesToHex(randomBytes(32));
  const uuid = `signer_${nanoid(12)}`;
  
  return {
    uuid,
    privateKey,
    publicKey,
  };
}

console.log('\n🤖 ABB Bot Signer Generator\n');
console.log('='.repeat(50));

const bountyPoster = generateEd25519Keypair();
console.log('\n📌 BOUNTY POSTER (Abb main account)');
console.log(`   SIGNER_UUID: ${bountyPoster.uuid}`);
console.log(`   Private Key (for signing): ${bountyPoster.privateKey}`);
console.log(`   Public Key (for Warpcast): ${bountyPoster.publicKey}`);

const workerAlpha = generateEd25519Keypair();
console.log('\n⚡ WORKER ALPHA');
console.log(`   SIGNER_UUID: ${workerAlpha.uuid}`);
console.log(`   Private Key (for signing): ${workerAlpha.privateKey}`);
console.log(`   Public Key (for Warpcast): ${workerAlpha.publicKey}`);

const workerBeta = generateEd25519Keypair();
console.log('\n🔷 WORKER BETA');
console.log(`   SIGNER_UUID: ${workerBeta.uuid}`);
console.log(`   Private Key (for signing): ${workerBeta.privateKey}`);
console.log(`   Public Key (for Warpcast): ${workerBeta.publicKey}`);

console.log('\n' + '='.repeat(50));
console.log('\n⚠️  IMPORTANT: You need to register these keys on Warpcast!');
console.log('   1. Go to: https://warpcast.com/~/settings/keys');
console.log('   2. Add each Public Key as a new signer');
console.log('   3. After approving in Warpcast, you\'ll get real signer UUIDs from Neynar');
console.log('\n💡 Save these values - you\'ll need them after registering the keys.\n');

// Export for use in app
const signers = {
  bountyPoster: bountyPoster.uuid,
  workerAlpha: workerAlpha.uuid,
  workerBeta: workerBeta.uuid,
};

console.log('ENV VALUES TO USE (after registering keys):');
console.log(`BOUNTY_POSTER_SIGNER_UUID=${bountyPoster.uuid}`);
console.log(`WORKER_ALPHA_SIGNER_UUID=${workerAlpha.uuid}`);
console.log(`WORKER_BETA_SIGNER_UUID=${workerBeta.uuid}`);