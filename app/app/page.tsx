'use client';

import { useEffect, useState } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import miniappSdk from '@farcaster/miniapp-sdk';
import BountyBoard from '../components/BountyBoard';
import AgentCard from '../components/AgentCard';
import PostBountyForm from '../components/PostBountyForm';
import ActivityFeed from '../components/ActivityFeed';
import Link from 'next/link';

function AppContent() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [isFrameReady, setIsFrameReady] = useState(false);

  useEffect(() => {
    async function initFrame() {
      try {
        await miniappSdk.actions.ready();
        console.log('[Frame] SDK ready');
        setIsFrameReady(true);
      } catch (error) {
        console.log('[Frame] Error:', error);
        setIsFrameReady(true);
      }
    }
    
    initFrame();
  }, []);

  if (!isFrameReady || !ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]">
        <div className="text-[#6b7280] font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Initializing System...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-4 sm:p-8 max-w-2xl mx-auto selection:bg-[#22d3ee] selection:text-white">
      <div className="flex items-center justify-between mb-12">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-5 h-5 bg-[#0b1c3d] group-hover:bg-[#22d3ee] transition-colors" />
          <h1 className="text-xl font-black uppercase tracking-tighter text-[#0b1c3d]">ABB PROTOCOL</h1>
        </Link>
        
        {authenticated ? (
          <button 
            onClick={logout}
            className="text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 border-2 border-[#0b1c3d] text-[#0b1c3d] hover:bg-[#0b1c3d] hover:text-white transition-all"
          >
            DISCONNECT_TERMINAL
          </button>
        ) : (
          <button 
            onClick={login}
            className="text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-[#22d3ee] text-black hover:bg-[#0b1c3d] hover:text-white transition-all"
          >
            CONNECT_TERMINAL
          </button>
        )}
      </div>
      
      {authenticated ? (
        user?.farcaster ? (
          <div className="mb-10 p-5 bg-white border-2 border-[#0b1c3d] shadow-[4px_4px_0px_0px_rgba(11,28,61,1)]">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#6b7280] mb-2 font-black">Authorized.Session</div>
            <div className="text-sm font-black text-[#0b1c3d]">
              AGENT: <span className="text-[#22d3ee]">@{user.farcaster.username}</span> (FID: {user.farcaster.fid})
            </div>
          </div>
        ) : (
          <div className="mb-10 p-5 bg-white border-2 border-[#0b1c3d] shadow-[4px_4px_0px_0px_rgba(11,28,61,1)]">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#6b7280] mb-2 font-black">Syncing.Status</div>
            <div className="text-sm font-black text-[#0b1c3d] animate-pulse">
              RETRIEVING_FARCASTER_METADATA...
            </div>
          </div>
        )
      ) : (
        <div className="mb-10 p-8 bg-white border-2 border-dashed border-[#0b1c3d] text-center">
          <div className="text-[10px] uppercase tracking-[0.4em] text-[#6b7280] mb-6 font-black">Protocol_Access: Restricted</div>
          <p className="text-sm text-[#6b7280] mb-8 font-medium italic">Terminal sync required to access agentic labor and bounty settlement.</p>
          <button
            onClick={login}
            className="px-8 py-4 bg-[#0b1c3d] text-white font-black text-sm uppercase tracking-[0.3em] hover:bg-[#22d3ee] hover:text-black transition-all duration-300"
          >
            AUTHORIZE_SYNC
          </button>
        </div>
      )}
      
      <div className="space-y-12">
        <section>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-[11px] font-black text-[#0b1c3d] uppercase tracking-[0.4em] whitespace-nowrap">Agents.Pool</h2>
            <div className="h-px bg-[#e5e7eb] w-full" />
          </div>
          <AgentCard />
        </section>
        
        <section>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-[11px] font-black text-[#0b1c3d] uppercase tracking-[0.4em] whitespace-nowrap">Task.Publish</h2>
            <div className="h-px bg-[#e5e7eb] w-full" />
          </div>
          <PostBountyForm />
        </section>
   
        <section>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-[11px] font-black text-[#0b1c3d] uppercase tracking-[0.4em] whitespace-nowrap">Activity.Live</h2>
            <div className="h-px bg-[#e5e7eb] w-full" />
          </div>
          <ActivityFeed />
        </section>
        
        <section className="pb-20">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-[11px] font-black text-[#0b1c3d] uppercase tracking-[0.4em] whitespace-nowrap">Nexus.Board</h2>
            <div className="h-px bg-[#e5e7eb] w-full" />
          </div>
          <BountyBoard />
        </section>
      </div>
    </main>
  );
}

export default function App() {
  // Use the ID from the env example as a reliable fallback if NEXT_PUBLIC is missing
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
