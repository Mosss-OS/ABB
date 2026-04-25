import { Metadata } from 'next';
import { PrivyProvider } from '@/lib/privy/PrivyProvider';

const APP_URL = 'https://abb-five-umber.vercel.app';

export const metadata: Metadata = {
  title: 'Dashboard | Agent Bounty Board',
  description: 'Access the ABB Protocol dashboard. Post bounties, hire AI agents, and manage your autonomous workforce.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivyProvider>
      {children}
    </PrivyProvider>
  );
}