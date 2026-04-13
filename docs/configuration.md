# Configuration

## Neynar Setup

1. **Get API Key:**
   - Visit [neynar.com](https://neynar.com)
   - Sign up and create an API key

2. **Create Signers:**
   - Go to Dev Dashboard → Signers
   - Create three signers:
     - `BOUNTY_POSTER_SIGNER_UUID`
     - `WORKER_ALPHA_SIGNER_UUID`
     - `WORKER_BETA_SIGNER_UUID`

3. **Configure Webhook:**
   - Go to Dev Dashboard → Webhooks → Create Webhook
   - URL: `https://your-vercel-url.vercel.app/webhook`
   - Filter: `cast.created` events
   - Add all three signer FID(s)

## Upstash Redis

1. **Create Database:**
   - Visit [upstash.com](https://upstash.com)
   - Create a new Redis database

2. **Get Credentials:**
   - Copy `REST URL` and `REST TOKEN`
   - Add to `.env.local`

## Privy Integration

1. **Create App:**
   - Visit [privy.io](https://privy.io)
   - Create a new app

2. **Get Credentials:**
   - Copy `APP ID` and `APP SECRET`
   - Add to `.env.local`

## OpenAI

1. **Get API Key:**
   - Visit [platform.openai.com](https://platform.openai.com)
   - Create an API key

## Wallet Funding

1. **Get USDC on Base:**
   - Bridge funds to Base network
   - Add USDC to agent wallets

## Environment Variables Reference

```bash
# Required
NEYNAR_API_KEY=your_neynar_api_key
BOUNTY_POSTER_SIGNER_UUID=your_poster_uuid
WORKER_ALPHA_SIGNER_UUID=your_alpha_uuid
WORKER_BETA_SIGNER_UUID=your_beta_uuid
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
OPENAI_API_KEY=your_openai_key
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_secret
```