import fetch from 'node-fetch';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2';

const AGENTS = [
  { name: 'bounty-poster', role: 'Bounty poster agent' },
  { name: 'worker-alpha', role: 'Worker agent alpha' },
  { name: 'worker-beta', role: 'Worker agent beta' },
];

interface SignerResponse {
  signer_uuid?: string;
  public_key?: string;
  fid?: string;
  approval_url?: string;
  error?: string;
}

async function createSigner(name: string, role: string): Promise<SignerResponse> {
  console.log(`\nCreating signer for ${name}...`);

  try {
    const res = await fetch(`${NEYNAR_BASE_URL}/signer`, {
      method: 'POST',
      headers: {
        'api_key': NEYNAR_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, role }),
    });

    const data = await res.json();

    if (data.error) {
      console.error(`Error for ${name}:`, data.error);
      return { error: data.error };
    }

    console.log(`=== ${name} ===`);
    console.log('Signer UUID:', data.signer_uuid);
    console.log('Public Key:', data.public_key);
    console.log('FID:', data.fid);
    console.log('Approval URL:', data.approval_url);

    return data;
  } catch (err) {
    console.error(`Failed to create signer for ${name}:`, err);
    return { error: String(err) };
  }
}

async function main() {
  if (!NEYNAR_API_KEY) {
    console.error('Error: NEYNAR_API_KEY not set in environment');
    console.log('\nTo get your API key:');
    console.log('1. Go to https://neynar.com');
    console.log('2. Sign up / Log in');
    console.log('3. Go to Developer Dashboard → API Keys');
    console.log('4. Copy your API key');
    process.exit(1);
  }

  console.log('='.repeat(50));
  console.log('NEYNAR SIGNER CREATION SCRIPT');
  console.log('='.repeat(50));
  console.log('\n⚠️  Note: Creating signers requires a paid Neynar plan ($29/month)');
  console.log('If you get errors about plan requirements, you have these options:');
  console.log('1. Upgrade at neynar.com → Pricing');
  console.log('2. Use existing signers from another project');
  console.log('3. Contact Neynar for hackathon pricing\n');

  const results: SignerResponse[] = [];

  for (const agent of AGENTS) {
    const result = await createSigner(agent.name, agent.role);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const successful = results.filter(r => r.signer_uuid && !r.error);

  console.log('\n' + '='.repeat(50));
  console.log('RESULTS');
  console.log('='.repeat(50));

  if (successful.length > 0) {
    console.log('\n✅ Successfully created signers!\n');
    console.log('Add these to your .env.local:\n');

    for (const agent of AGENTS) {
      const result = results.find(r => r.public_key);
      if (result?.signer_uuid && result?.fid) {
        const upper = agent.name.toUpperCase().replace(/-/g, '_');
        console.log(`${upper}_SIGNER_UUID=${result.signer_uuid}`);
        console.log(`${upper}_FID=${result.fid}`);
        console.log('');
      }
    }

    console.log('\nNext steps:');
    console.log('1. Open each approval_url in a browser');
    console.log('2. Approve with your Warpcast account');
    console.log('3. Run the script again to verify approval');
  } else {
    console.log('\n❌ No signers created. Possible reasons:');
    console.log('- Neynar paid plan required');
    console.log('- API key invalid or expired');
    console.log('- Network issues');
    console.log('\nAlternative: Use existing signers');
    console.log('If you have existing signer UUIDs, add them to .env.local:');
    for (const agent of AGENTS) {
      const upper = agent.name.toUpperCase().replace(/-/g, '_');
      console.log(`${upper}_SIGNER_UUID=your-existing-uuid`);
    }
  }
}

main().catch(console.error);