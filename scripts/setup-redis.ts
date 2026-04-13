import axios from 'axios';

const UPSTASH_API_KEY = process.env.UPSTASH_API_KEY;

if (!UPSTASH_API_KEY) {
  console.error('Please set UPSTASH_API_KEY in your environment');
  console.log('\nTo get your API key:');
  console.log('1. Go to https://upstash.com');
  console.log('2. Sign up / Login');
  console.log('3. Go to Dashboard → Your account → API Key');
  console.log('4. Copy the API key\n');
  process.exit(1);
}

async function createRedisDatabase(name: string = 'agent-bounty-board') {
  console.log(`Creating Redis database: ${name}...\n`);
  
  try {
    const response = await axios.post(
      'https://api.upstash.com/v2/databases',
      {
        name,
        region: 'gcp-us-east-1',
        multiZone: false,
        tier: 'free',
        enablePersistence: false,
        enableEviction: false,
        maxDatabases: 1,
      },
      {
        headers: {
          'Authorization': `Bearer ${UPSTASH_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const db = response.data;
    console.log('Database created!');
    console.log('\n--- Add to .env.local ---');
    console.log(`UPSTASH_REDIS_REST_URL=${db.rest_url}`);
    console.log(`UPSTASH_REDIS_REST_TOKEN=${db.rest_token}`);
    console.log('-------------------------\n');
    
    return db;
  } catch (error: any) {
    if (error.response?.data?.message?.includes('limit')) {
      console.log('You already have the maximum number of free databases.');
      console.log('Please delete an existing one or upgrade to a paid plan.');
    } else {
      console.error('Error creating database:', error.response?.data || error.message);
    }
    process.exit(1);
  }
}

async function listDatabases() {
  console.log('Fetching databases...\n');
  
  try {
    const response = await axios.get('https://api.upstash.com/v2/databases', {
      headers: { 'Authorization': `Bearer ${UPSTASH_API_KEY}` },
    });
    
    const databases = response.data;
    if (databases.length === 0) {
      console.log('No databases found.');
    } else {
      console.log('Your databases:\n');
      databases.forEach((db: any) => {
        console.log(`- ${db.name} (${db.tier})`);
        console.log(`  REST URL: ${db.rest_url}`);
        console.log(`  Created: ${db.created_at}\n`);
      });
    }
  } catch (error) {
    console.error('Error fetching databases:', error);
  }
}

const command = process.argv[2];

switch (command) {
  case 'create':
    createRedisDatabase();
    break;
  case 'list':
    listDatabases();
    break;
  default:
    console.log('Usage: pnpm setup-redis <command>');
    console.log('\nCommands:');
    console.log('  create  - Create a new Redis database');
    console.log('  list    - List your databases');
    console.log('\nFirst, set your API key:');
    console.log('  export UPSTASH_API_KEY=your_api_key');
}