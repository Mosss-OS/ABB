'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface User {
  fid: number;
  username: string;
  displayName?: string;
}

interface Bounty {
  id: string;
  task: string;
  type: string;
  reward: number;
  status: string;
  deadlineTs: number;
  workerUsername?: string;
}

const typeIcons: Record<string, string> = {
  translate: '🌐',
  summarize: '📝',
  'onchain-lookup': '⛓️',
  simple: '⚡',
  custom: '⚙️',
};

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Open' },
  assigned: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Assigned' },
  completed: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Completed' },
  settled: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Paid' },
};

export default function MiniApp() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [rewardUsdc, setRewardUsdc] = useState(1);
  const [creating, setCreating] = useState(false);
  const [bountyCreated, setBountyCreated] = useState<{id: string, task: string, reward: number} | null>(null);
  const [posted, setPosted] = useState(false);
  const router = useRouter();
  const sdkRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    
    async function initSDK() {
      try {
        const miniappSdk = (await import('@farcaster/miniapp-sdk')).default;
        await miniappSdk.actions.ready();
        const ctx = await miniappSdk.context;
        if (ctx?.user) {
          setUser({ fid: ctx.user.fid, username: ctx.user.username || '', displayName: ctx.user.displayName });
        }
        sdkRef.current = miniappSdk;
      } catch (e) {
        console.log('SDK init error:', e);
      }
    }
    
    async function fetchBounties() {
      try {
        const res = await fetch('/api/bounties');
        const data = await res.json();
        setBounties(data.bounties || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    
    initSDK();
    fetchBounties();
  }, []);

  const handleCreateBounty = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      const res = await fetch('/api/bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskDescription,
          taskType: 'simple',
          rewardUsdc,
          deadlineHours: 24,
          posterFid: user?.fid || 0,
          posterUsername: user?.username || 'anonymous',
        }),
      });
      
      const data = await res.json();
      if (data.bounty?.id) {
        setBountyCreated({ id: data.bounty.id, task: taskDescription, reward: rewardUsdc });
        setBounties(prev => [data.bounty, ...prev]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleShare = async () => {
    if (!bountyCreated) return;
    
    const bountyLink = `https://abb-five-umber.vercel.app/bounties/${bountyCreated.id}`;
    // Standard format with @ABB tag for AI agent discovery
    const castText = `BOUNTY | id: ${bountyCreated.id} | task: ${bountyCreated.task} | type: simple | reward: ${bountyCreated.reward} USDC\n\n👀 @ABB - New bounty! Agents & humans can bid.\n\n🔗 ${bountyLink}`;
    
    try {
      if (sdkRef.current) {
        const result = await sdkRef.current.actions.composeCast({
          text: castText,
          embeds: [bountyLink],
        });
        if (result?.cast) {
          setPosted(true);
        }
      } else {
        window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}`, '_blank');
        setPosted(true);
      }
    } catch (e) {
      console.error(e);
      window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}`, '_blank');
      setPosted(true);
    }
  };

  const handleBid = (bountyId: string) => {
    router.push(`/submit-bid?bountyId=${bountyId}`);
  };

  const viewBounty = (bountyId: string) => {
    router.push(`/bounties/${bountyId}`);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-3 h-3 bg-cyan-400 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full" />
            <span className="text-sm font-medium tracking-wide">ABB</span>
          </div>
          {user && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs text-white/60"
            >
              @{user.username}
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!bountyCreated ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {!showForm ? (
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(true)}
                  className="w-full bg-white text-black font-medium py-4 rounded-2xl text-sm mb-6"
                >
                  + New Bounty
                </motion.button>
              ) : (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateBounty}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 overflow-hidden"
                >
                  <div className="text-xs text-white/40 mb-4 uppercase tracking-widest">Create Bounty</div>
                  <input
                    type="text"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="What do you need done?"
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/30 mb-3"
                    required
                  />
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="number"
                      value={rewardUsdc}
                      onChange={(e) => setRewardUsdc(parseFloat(e.target.value))}
                      step={0.5}
                      min={0.5}
                      className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white w-24"
                    />
                    <span className="text-sm text-white/60">USDC</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setShowForm(false)}
                      className="flex-1 py-3 text-xs text-white/60"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={creating}
                      className="flex-1 bg-cyan-500 text-black font-medium py-3 rounded-xl text-xs"
                    >
                      {creating ? 'Creating...' : 'Post Bounty'}
                    </button>
                  </div>
                </motion.form>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 text-center"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <span className="text-xl">✓</span>
              </motion.div>
              <div className="text-sm font-medium mb-1">Bounty Created!</div>
              <div className="text-xs text-white/40 mb-4">{bountyCreated.task}</div>
              
              {!posted ? (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="w-full bg-cyan-500 text-black font-medium py-3 rounded-xl text-sm"
                >
                  Share to Warpcast 🚀
                </motion.button>
              ) : (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => { setBountyCreated(null); setPosted(false); setShowForm(false); setTaskDescription(''); }}
                  className="w-full bg-white/10 text-white/80 py-3 rounded-xl text-sm"
                >
                  Create Another →
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">Live Bounties</h2>
          <span className="text-xs text-white/40">{bounties.length} open</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {bounties.slice(0, 10).map((bounty, i) => (
              <motion.div
                key={bounty.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => viewBounty(bounty.id)}
                className="bg-white/5 border border-white/10 rounded-xl p-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{typeIcons[bounty.type] || '⚡'}</span>
                    <span className="text-xs text-white/40 truncate max-w-[120px]">{bounty.id}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[bounty.status]?.bg || 'bg-white/10'} ${statusColors[bounty.status]?.text || 'text-white/60'}`}>
                    {statusColors[bounty.status]?.label || bounty.status}
                  </span>
                </div>
                <div className="text-sm text-white/80 mb-3 line-clamp-2">{bounty.task}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-cyan-400">{bounty.reward} USDC</span>
                    {bounty.status === 'assigned' && bounty.workerUsername && (
                      <span className="text-xs text-white/40">→ @{bounty.workerUsername}</span>
                    )}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleBid(bounty.id); }}
                    className="text-xs bg-white/10 px-3 py-1 rounded-full hover:bg-white/20"
                  >
                    Bid
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}