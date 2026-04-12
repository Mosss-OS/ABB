'use client';

import { useEffect, useState } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import miniappSdk from '@farcaster/miniapp-sdk';
import BountyBoard from '../components/BountyBoard';
import PostBountyForm from '../components/PostBountyForm';
import Link from 'next/link';

function AppContent() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [isFrameReady, setIsFrameReady] = useState(false);

  useEffect(() => {
    async function initFrame() {
      try {
        await miniappSdk.actions.ready();
        setIsFrameReady(true);
      } catch (error) {
        setIsFrameReady(true);
      }
    }
    initFrame();
  }, []);

  if (!isFrameReady || !ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b1c3d]">
        <div className="text-white/60 font-black uppercase text-[10px] animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-3 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#22d3ee]" />
          <span className="font-bold text-sm text-[#0b1c3d]">ABB</span>
        </Link>
        {authenticated ? (
          <button onClick={logout} className="text-[8px] px-2 py-1 border border-[#0b1c3d] text-[#0b1c3d]">X</button>
        ) : (
          <button onClick={login} className="text-[8px] px-2 py-1 bg-[#22d3ee] text-black">CONNECT</button>
        )}
      </div>

      {authenticated ? (
        <div className="mb-4 p-2 bg-white border border-[#0b1c3d]">
          <div className="text-[8px] text-[#6b7280]">@{user?.farcaster?.username || 'user'}</div>
        </div>
      ) : (
        <div className="mb-4 p-4 bg-white border border-dashed border-[#0b1c3d] text-center">
          <p className="text-[10px] text-[#6b7280] mb-2">Connect to access bounties</p>
          <button onClick={login} className="w-full py-2 bg-[#0b1c3d] text-white text-[10px]">CONNECT FARCASTER</button>
        </div>
      )}

      {authenticated && (
        <div className="space-y-3">
          <section className="p-3 bg-white border border-[#0b1c3d]">
            <div className="text-[8px] text-[#6b7280] mb-2">POST BOUNTY</div>
            <PostBountyForm />
          </section>

          <section className="p-3 bg-white border border-[#0b1c3d]">
            <div className="text-[8px] text-[#6b7280] mb-2">BOUNTIES</div>
            <BountyBoard />
          </section>
        </div>
      )}
    </main>
  );
}

export default function App() {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmnmz4gar04130ckyl41y48m1';
  
  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['farcaster'],
        appearance: {
          theme: 'light',
          accentColor: '#22d3ee',
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <AppContent />
    </PrivyProvider>
  );
}