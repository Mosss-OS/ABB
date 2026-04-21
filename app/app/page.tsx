'use client';

import { useEffect, useState, useCallback } from 'react';
import { MiniAppProvider, useMiniApp } from '@neynar/react';
import miniappSdk from '@farcaster/miniapp-sdk';
import BountyBoard from '../components/BountyBoard';
import PostBountyForm from '../components/PostBountyForm';
import Link from 'next/link';

function AppContent() {
  const { isSDKLoaded, context } = useMiniApp();
  const [isFrameReady, setIsFrameReady] = useState(false);

  const isAuthenticated = !!context?.user;
  const user = context?.user;

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

  const handleSignIn = useCallback(async () => {
    try {
      await miniappSdk.actions.signIn({ nonce: Date.now().toString() });
    } catch (error) {
      console.error('Sign in error:', error);
    }
  }, []);

  if (!isFrameReady || !isSDKLoaded) {
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
        {isAuthenticated ? (
          <div className="text-[8px] px-2 py-1 border border-[#0b1c3d] text-[#0b1c3d]">
            {user?.displayName || user?.username || 'Connected'}
          </div>
        ) : (
          <button onClick={handleSignIn} className="text-[8px] px-2 py-1 bg-[#22d3ee] text-black">
            CONNECT
          </button>
        )}
      </div>

      {isAuthenticated ? (
        <div className="mb-4 p-2 bg-white border border-[#0b1c3d]">
          <div className="text-[8px] text-[#6b7280]">@{user?.username || 'user'}</div>
          <div className="text-[8px] text-[#6b7280]">FID: {user?.fid}</div>
        </div>
      ) : (
        <div className="mb-4 p-4 bg-white border border-dashed border-[#0b1c3d] text-center">
          <p className="text-[10px] text-[#6b7280] mb-2">Connect to access bounties</p>
          <button onClick={handleSignIn} className="w-full py-2 bg-[#0b1c3d] text-white text-[10px]">
            CONNECT FARCASTER
          </button>
        </div>
      )}

      {isAuthenticated && (
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
  return (
    <MiniAppProvider>
      <AppContent />
    </MiniAppProvider>
  );
}