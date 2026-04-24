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
  custom: '🎯',
};

const typeColors: Record<string, string> = {
  translate: 'bg-blue-500/20 text-blue-400',
  summarize: 'bg-purple-500/20 text-purple-400',
  'onchain-lookup': 'bg-yellow-500/20 text-yellow-400',
  simple: 'bg-meat-potato/20 text-meat-potato',
  custom: 'bg-meat-pink/20 text-meat-pink',
};

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Open' },
  assigned: { bg: 'bg-meat-potato/20', text: 'text-meat-potato', label: 'Assigned' },
  completed: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Completed' },
  settled: { bg: 'bg-meat-red/20', text: 'text-meat-pink', label: 'Paid' },
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
          setUser({ fid: ctx.user.fid, username: ctx.user.username || '' });
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
      
      if (res.ok) {
        const data = await res.json();
        setBountyCreated(data.bounty);
        
        const castText = `🔔 New Bounty: "${data.bounty.task}" - Reward: ${data.bounty.reward} USDC`;
        
        try {
          if (sdkRef.current) {
            const result = await sdkRef.current.actions.composeCast({
              text: castText,
              embeds: [`https://abb-five-umber.vercel.app/bounties/${data.bounty.id}`],
            });
            if (result?.cast) {
              setPosted(true);
            }
          } else {
            window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embedUrl=${encodeURIComponent(`https://abb-five-umber.vercel.app/bounties/${data.bounty.id}`)}`, '_blank');
            setPosted(true);
          }
        } catch (e) {
          console.error(e);
          window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}`, '_blank');
          setPosted(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
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
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-3 h-3 bg-meat-pink rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text pb-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-meat-pink rounded-full animate-pulse" />
            <span className="text-sm font-bold tracking-wide uppercase text-white">ABB</span>
          </div>
          {user && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs text-dark-muted"
            >
              @{user.username}
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!bountyCreated ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {!showForm ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-black uppercase tracking-tight text-white">Active Bounties</h1>
                    <button 
                      onClick={() => setShowForm(true)}
                      className="bg-gradient-meat text-black font-bold text-xs px-4 py-2 rounded-sm uppercase tracking-wider"
                    >
                      + New
                    </button>
                  </div>
                  
                  {loading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="bg-dark-card border border-dark-border rounded-sm h-24 animate-pulse" />
                      ))}
                    </div>
                  ) : bounties.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">🍽️</div>
                      <div className="text-lg font-bold text-white mb-2">No Bounties Yet</div>
                      <div className="text-sm text-dark-muted mb-6">Post your first bounty to get started</div>
                      <button 
                        onClick={() => setShowForm(true)}
                        className="bg-gradient-meat text-black font-bold text-sm px-6 py-3 rounded-sm"
                      >
                        Post Bounty
                      </button>
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
                          className="bg-dark-card border border-dark-border rounded-sm p-4 active:scale-[0.98] transition-transform cursor-pointer hover:border-meat-brown/30"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-sm flex items-center justify-center text-xl ${typeColors[bounty.type] || typeColors.simple}`}>
                              {typeIcons[bounty.type] || '⚡'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-dark-muted">{bounty.id}</span>
                                <span className={`px-2 py-0.5 rounded-sm text-[10px] font-medium ${statusColors[bounty.status]?.bg || 'bg-white/10'} ${statusColors[bounty.status]?.text || 'text-dark-muted'}`}>
                                  {statusColors[bounty.status]?.label || bounty.status}
                                </span>
                              </div>
                              <div className="text-sm text-dark-text line-clamp-2">{bounty.task}</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pl-13">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-meat-potato">💰 {bounty.reward} USDC</span>
                              {bounty.status === 'assigned' && bounty.workerUsername && (
                                <span className="text-xs text-dark-muted">→ @{bounty.workerUsername}</span>
                              )}
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleBid(bounty.id); }}
                              disabled={bounty.status !== 'open'}
                              className={`text-xs border border-dark-border px-3 py-1 rounded-sm ${bounty.status !== 'open' ? 'opacity-50 cursor-not-allowed' : 'hover:border-meat-brown/50'}`}
                            >
                              Bid
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateBounty}
                  className="bg-dark-card border border-dark-border rounded-sm p-5 mb-6 overflow-hidden"
                >
                  <div className="text-xs text-dark-muted mb-4 uppercase tracking-widest">Create Bounty</div>
                  <input
                    type="text"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="What do you need done?"
                    className="w-full bg-dark-bg border border-dark-border rounded-sm p-4 text-sm text-dark-text placeholder-dark-muted mb-3"
                    required
                  />
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="number"
                      value={rewardUsdc}
                      onChange={(e) => setRewardUsdc(parseFloat(e.target.value))}
                      step={0.5}
                      min={0.5}
                      className="bg-dark-bg border border-dark-border rounded-sm px-4 py-3 text-sm text-dark-text w-24"
                    />
                    <span className="text-sm text-dark-muted">USDC</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setShowForm(false)}
                      className="flex-1 py-3 text-xs text-dark-muted"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={creating}
                      className="flex-1 bg-gradient-meat text-black font-bold py-3 rounded-sm text-xs"
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
              className="bg-dark-card border border-dark-border rounded-sm p-6 mb-6 text-center"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-12 h-12 bg-gradient-meat rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <span className="text-xl text-black">✓</span>
              </motion.div>
              <div className="text-sm font-bold mb-1 text-white">Bounty Created!</div>
              <div className="text-xs text-dark-muted mb-4">{bountyCreated.task}</div>
              <div className="text-lg font-black text-meat-potato mb-4">💰 {bountyCreated.reward} USDC</div>
              
              {posted && (
                <div className="text-xs text-green-400 mb-4">✓ Posted to Warpcast</div>
              )}
              
              <button 
                onClick={() => { setBountyCreated(null); setShowForm(false); }}
                className="text-xs text-dark-muted hover:text-white"
              >
                Create Another →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}