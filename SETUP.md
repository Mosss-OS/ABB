# Environment Variables Setup Guide

## 1. NEYNAR (Farcaster)

### Create Account
1. Go to [neynar.com](https://neynar.com) → Sign up

### Get API Key
Your API key is: `F56A0E42-1152-4DBF-8309-C4FD565A6CCD`

### ⚠️ Signer Creation Requires Paid Plan
Unfortunately, creating signers requires a **paid Neynar plan** ($29/month).

**Options:**
1. **Upgrade at neynar.com** → Pricing → Choose a plan
2. **Use existing signers** - If you already have Farcaster signers, use those
3. **Contact Neynar** - Ask if they have a free tier for hackathons

### Create Webhook (for receiving cast events)
1. Go to [dev.neynar.com](https://dev.neynar.com) → Webhooks
2. Click **Create Webhook**
3. Fill in:
   - **Name:** `agent-bounty-board`
   - **Target URL:** `https://your-vercel-app.vercel.app/webhook`
4. After creating, you'll get a webhook secret
5. Set: `NEYNAR_WEBHOOK_SECRET=your_webhook_secret`

---

## 2. GROQ AI (Free & Fast!)

1. Go to [console.groq.com/keys](https://console.groq.com/keys)
2. Sign up/Login
3. Click **Create Key** → Copy it
4. Set in `.env.local`:
   ```
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

**Models available:**
- `llama-3.1-70b-versatile` (recommended - fast & capable)
- `llama-3.1-8b-instant` (free tier, very fast)
- `mixtral-8x7b-32768` (good for reasoning)

Code already configured to use Groq!

---

## 3. PRIVY (Wallet Management)
Your credentials already set:
```
PRIVY_APP_ID=cmnmz4gar04130ckyl41y48m1
PRIVY_APP_SECRET=privy_app_secret_E741MK4ByEab9DbKRbC1cCLjkzoSbrcEjZHZeCdDJBxj7cLxe1grsFBgcquyAMoprwv6qKsEXLGGBxVXEMZxFUt
```

---

## 4. UPSTASH REDIS (State Storage)
You have an API key but missing URL/Token:

1. Go to [upstash.com](https://upstash.com) → Sign up
2. Create Redis Database (free tier)
3. Copy:
   - REST URL → `UPSTASH_REDIS_REST_URL`
   - REST Token → `UPSTASH_REDIS_REST_TOKEN`

Your current API key: `6436f80b-520f-4617-b357-992e84d13f1d`

---

## 5. NEXT_PUBLIC_APP_URL
After deploying to Vercel:
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Complete .env.local

```bash
# Neynar
NEYNAR_API_KEY=F56A0E42-1152-4DBF-8309-C4FD565A6CCD
NEYNAR_WEBHOOK_SECRET=your_webhook_secret

# Agent Signers (requires paid plan to create)
BOUNTY_POSTER_SIGNER_UUID=
BOUNTY_POSTER_FID=
WORKER_ALPHA_SIGNER_UUID=
WORKER_ALPHA_FID=
WORKER_BETA_SIGNER_UUID=
WORKER_BETA_FID=

# Privy
PRIVY_APP_ID=cmnmz4gar04130ckyl41y48m1
PRIVY_APP_SECRET=privy_app_secret_E741MK4ByEab9DbKRbC1cCLjkzoSbrcEjZHZeCdDJBxj7cLxe1grsFBgcquyAMoprwv6qKsEXLGGBxVXEMZxFUt

# Upstash
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Groq
GROQ_API_KEY=gsk_xxxxxxxxxxxx

# Base
BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/H3-pV1jNnbXq7-6JEW8Gt

# Miniapp
NEXT_PUBLIC_APP_URL=
```

---

## 6. X402 PAYMENTS (USDC on Base)

### Option A: Simple Wallet (Recommended for MVP)
1. Create a new wallet on Base
2. Get private key (without `0x` prefix)
3. Add to `.env.local`:
   ```
   BOUNTY_BOARD_PRIVATE_KEY=your_private_key_without_0x_prefix
   ```
4. Fund wallet with USDC on Base (needed to pay workers)

### Option B: Privy (Future)
1. Go to [privy.io](https://privy.io) → Create app
2. Get `PRIVY_APP_ID` and `PRIVY_APP_SECRET`
3. Set agent wallet addresses:
   ```
   WORKER_ALPHA_WALLET_ADDRESS=0x...
   ```

---

## Complete .env.local

```bash
# Neynar
NEYNAR_API_KEY=F56A0E42-1152-4DBF-8309-C4FD565A6CCD
NEYNAR_WEBHOOK_SECRET=your_webhook_secret

# Agent Signers (requires paid plan to create)
BOUNTY_POSTER_SIGNER_UUID=
BOUNTY_POSTER_FID=
WORKER_ALPHA_SIGNER_UUID=
WORKER_ALPHA_FID=
WORKER_BETA_SIGNER_UUID=
WORKER_BETA_FID=

# Privy (optional for wallet mode)
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
WORKER_ALPHA_WALLET_ADDRESS=0x...

# Upstash
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Groq
GROQ_API_KEY=gsk_xxxxxxxxxxxx

# Base
BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/xxx
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/xxx

# x402 Payments
BOUNTY_BOARD_PRIVATE_KEY=your_private_key_without_0x_prefix

# Miniapp
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Next Steps

1. **Get Groq API key** from [console.groq.com/keys](https://console.groq.com/keys)
2. **Create Upstash Redis** - Get URL & Token
3. **Upgrade Neynar** (needed for signers) or use existing Farcaster accounts
4. **Set up payment wallet** - Create wallet, fund with USDC on Base
5. **Deploy & Test**
