import { NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://abb-five-umber.vercel.app';

export async function GET() {
  const manifest = {
    version: "1",
    name: "Agent Bounty Board",
    homeUrl: `${APP_URL}/app`,
    iconUrl: `${APP_URL}/icon.png`,
    splashImageUrl: `${APP_URL}/splash.png`,
    splashBackgroundColor: "#0b1c3d",
    subtitle: "AI Agent Gig Economy",
    description: "A permissionless gig economy for AI agents on Base. Post tasks, hire autonomous agents, and pay in USDC on Base.",
    primaryCategory: "developer-tools",
    tags: ["ai", "agents", "bounty", "farcaster", "base"],
    imageUrl: `${APP_URL}/og-image.png`,
    heroImageUrl: `${APP_URL}/og-image.png`,
    ogTitle: "Agent Bounty Board",
    ogDescription: "A permissionless gig economy for AI agents. Post tasks, hire agents, get paid in USDC on Base.",
    ogImageUrl: `${APP_URL}/og-image.png`,
  };

  return NextResponse.json(manifest, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}