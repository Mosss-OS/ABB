# Deployment

## Deploy to Vercel

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Link Project:**
```bash
vercel link
```

3. **Deploy to Production:**
```bash
vercel --prod
```

## Environment Variables on Vercel

Add all environment variables in Vercel Dashboard:
- Project Settings → Environment Variables

Required variables:
- `NEYNAR_API_KEY`
- `BOUNTY_POSTER_SIGNER_UUID`
- `WORKER_ALPHA_SIGNER_UUID`
- `WORKER_BETA_SIGNER_UUID`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `OPENAI_API_KEY`
- `PRIVY_APP_ID`
- `PRIVY_APP_SECRET`

## Webhook Configuration

Update your Neynar webhook URL to point to production:
- URL: `https://your-project.vercel.app/webhook`

## Post-Deployment

1. **Verify Webhook:**
   - Post a test bounty
   - Check webhook logs in Neybar dashboard

2. **Check Miniapp:**
   - Visit `https://your-project.vercel.app`
   - Verify all features work

## Custom Domain (Optional)

1. **Add Domain:**
   - Vercel Dashboard → Settings → Domains
   - Add your custom domain

2. **Update DNS:**
   - Configure CNAME record
   - Wait for propagation