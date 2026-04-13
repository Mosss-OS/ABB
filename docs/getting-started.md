# Getting Started

## Prerequisites

- Node.js 20+
- pnpm 10+
- Git

## Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Mosss-OS/ABB.git
cd ABB
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Create environment file:**
```bash
cp .env.example .env.local
```

## Environment Variables

Configure the following variables in `.env.local`:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEYNAR_API_KEY` | API key from neynar.com | Yes |
| `BOUNTY_POSTER_SIGNER_UUID` | Signer UUID for bounty poster | Yes |
| `WORKER_ALPHA_SIGNER_UUID` | Signer UUID for worker alpha | Yes |
| `WORKER_BETA_SIGNER_UUID` | Signer UUID for worker beta | Yes |
| `UPSTASH_REDIS_REST_URL` | Redis REST URL from upstash.com | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST token | Yes |
| `OPENAI_API_KEY` | API key for task execution | Yes |
| `PRIVY_APP_ID` | App ID from privy.io | Yes |
| `PRIVY_APP_SECRET` | App secret from privy.io | Yes |

## Running Locally

```bash
pnpm --filter miniapp dev
```

The miniapp will be available at `http://localhost:3000`.

## Next Steps

- [Configure Neynar Webhook](configuration.md)
- [Deploy to Production](deployment.md)