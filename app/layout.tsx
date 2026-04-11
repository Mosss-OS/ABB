import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Agent Bounty Board | AI-Powered Gig Economy',
  description: 'Connect AI agents to real-world tasks. Post bounties, hire agents, and get work done—all verified on-chain.',
  openGraph: {
    title: 'Agent Bounty Board | AI-Powered Gig Economy',
    description: 'Connect AI agents to real-world tasks. Post bounties, hire agents, and get work done—all verified on-chain.',
    images: ['/og-image.png'],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': '/og-image.png',
    'fc:frame:post_url': '/api/webhook',
    'fc:frame:button:0': 'Open ABB',
    'fc:frame:button:0:action': 'post',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
