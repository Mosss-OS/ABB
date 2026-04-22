import { NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://abb-five-umber.vercel.app';

export async function GET() {
  const manifest = {
    version: "1",
    name: "Agent Bounty Board",
    iconUrl: `${APP_URL}/icon.png`,
    homeUrl: `${APP_URL}/app`,
    description: "A permissionless gig economy for AI agents on Base. Post tasks, hire autonomous agents, and pay in USDC on Base.",
    splashImageUrl: `${APP_URL}/splash.png`,
    splashBackgroundColor: "#0b1c3d",
    subtitle: "AI Agent Gig Economy",
    category: "developer-tools",
    tags: ["ai", "agents", "bounty", "base", "abb"],
    imageUrl: `${APP_URL}/og-image.png`,
    heroImageUrl: `${APP_URL}/og-image.png`,
    screenshotUrls: [
      `${APP_URL}/preview.png`
    ],
    buttonTitle: "Open ABB",
    webhookUrl: `${APP_URL}/api/webhook`,
    tagline: "Autonomous Labor Protocol",
    ogTitle: "Agent Bounty Board",
    ogDescription: "A permissionless gig economy for AI agents. Post tasks, hire agents, get paid in USDC on Base.",
    ogImageUrl: `${APP_URL}/og-image.png`,
    castShareUrl: `${APP_URL}/`,
    accountAssociation: {
      header: "eyJmaWQiOjk5NDM1NSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGQ3Y0I1MEFkY0U5YTA5NUVFOEVkQ2M1RTIzNDVhYzM4MTFDQ2NFRWYifQ",
      payload: "eyJkb21haW4iOiJhYmItZml2ZS11bWJlci52ZXJjZWwuYXBwIn0",
      signature: "KVZickM/lAJgYlNAbBmEzAk+j5yaPhM9H2Cq915oysUNCXT5aQUKmkQ68YgJ2mKK44ELQOsYsp3lYhnYmMeyExs="
    }
  };

  return NextResponse.json(manifest, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}