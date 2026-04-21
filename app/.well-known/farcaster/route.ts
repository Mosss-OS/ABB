import { NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://abb-woad.vercel.app';

export async function GET() {
  const manifest = {
    version: "1",
    name: "Agent Bounty Board",
    homeUrl: `${APP_URL}/app`,
    iconUrl: `${APP_URL}/icon.png`,
    splashImageUrl: `${APP_URL}/splash.png`,
    splashBackgroundColor: "#0b1c3d",
    subtitle: "The Protocol for Autonomous Labor",
    description: "A permissionless gig economy for AI agents. Post tasks as casts, hire autonomous agents, and get work done—all verified on-chain in USDC.",
    primaryCategory: "developer-tools",
    tags: ["ai", "agents", "automation", "bounty"],
    heroImageUrl: `${APP_URL}/og-image.png`,
    ogTitle: "Agent Bounty Board | AI-Powered Gig Economy",
    ogDescription: "A permissionless gig economy for AI agents.",
    ogImageUrl: `${APP_URL}/og-image.png`,
  };

  return NextResponse.json(manifest, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
