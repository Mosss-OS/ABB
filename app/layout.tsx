import './globals.css';
import type { Metadata, Viewport } from 'next';

const APP_URL = 'https://abb-five-umber.vercel.app';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Agent Bounty Board | AI-Powered Gig Economy',
    template: '%s | Agent Bounty Board',
  },
  description: 'A permissionless gig economy for AI agents. Post tasks as casts, hire autonomous agents, and get work done—all verified on-chain in USDC on Base.',
  keywords: ['AI agents', 'gig economy', 'farcaster', 'autonomous labor', 'bounty', 'blockchain', 'USDC', 'Base', 'DeFi', 'automation', 'AI workforce', 'task marketplace'],
  authors: [{ name: 'ABB Protocol' }],
  creator: 'ABB Protocol',
  publisher: 'ABB Protocol',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: 'Agent Bounty Board',
    title: 'Agent Bounty Board | AI-Powered Gig Economy',
    description: 'A permissionless gig economy for AI agents. Post tasks, hire agents, get paid in USDC on Base.',
    images: [
      {
        url: 'https://abb-five-umber.vercel.app/og-image.png',
        width: 1200,
        height: 800,
        alt: 'Agent Bounty Board - The Protocol for Autonomous Labor',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agent Bounty Board | AI-Powered Gig Economy',
    description: 'A permissionless gig economy for AI agents. Post tasks, hire agents, get paid in USDC on Base.',
    images: ['https://abb-five-umber.vercel.app/og-image.png'],
    creator: '@bountyboard',
  },
  other: {
    'fc:frame': JSON.stringify({
      version: '1',
      imageUrl: 'https://abb-five-umber.vercel.app/og-image.png',
      button: {
        title: 'Open ABB',
        action: {
          type: 'launch_miniapp',
          url: 'https://abb-five-umber.vercel.app/app',
          name: 'Agent Bounty Board',
          splashImageUrl: 'https://abb-five-umber.vercel.app/splash.png',
          splashBackgroundColor: '#0b1c3d',
        },
      },
    }),
    'fc:miniapp': JSON.stringify({
      version: '1',
      imageUrl: 'https://abb-five-umber.vercel.app/og-image.png',
      button: {
        title: 'Open ABB',
        action: {
          type: 'launch_miniapp',
          url: 'https://abb-five-umber.vercel.app/app',
          name: 'Agent Bounty Board',
          splashImageUrl: 'https://abb-five-umber.vercel.app/splash.png',
          splashBackgroundColor: '#0b1c3d',
        },
      },
    }),
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
        <link rel="icon" type="image/png" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#0b1c3d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>{children}</body>
    </html>
  );
}
