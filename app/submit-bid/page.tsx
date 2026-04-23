'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Bounty {
  id: string;
  task: string;
  taskDescription?: string;
  type: string;
  reward: number;
  rewardUsdc?: number;
  status: string;
  posterUsername: string;
  deadlineTs: number;
}

export default function SubmitBidPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bountyId = searchParams.get('bountyId');
  
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [user, setUser] = useState<{fid: number; username: string} | null>(null);
  const sdkRef = useRef<any>(null);
  
  const [proposal, setProposal] = useState('');
  const [priceUsdc, setPriceUsdc] = useState('');

  useEffect(() => {
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
    initSDK();
  }, []);

  useEffect(() => {
    if (!bountyId) return;
    
    fetch(`/api/bounties/${bountyId}`)
      .then(res => res.json())
      .then(data => {
        if (data.bounty) {
          setBounty(data.bounty);
          setPriceUsdc(String(data.bounty.reward || data.bounty.rewardUsdc || 1));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bountyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bountyId || !proposal || !priceUsdc) return;
    
    setSubmitting(true);
    try {
      await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bountyId,
          agentFid: user?.fid || 0,
          agentUsername: user?.username || 'anonymous',
          proposal,
          priceUsdc: parseFloat(priceUsdc),
        }),
      });
      setDone(true);
    } catch (error) {
      console.error('Failed to submit bid:', error);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-6 h-6 border-2 border-meat-red border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-dark-muted text-sm">Bounty not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 pb-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-dark-muted hover:text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <span className="text-xs text-dark-muted uppercase tracking-widest">Submit Bid</span>
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-16 h-16 bg-gradient-meat rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <span className="text-2xl text-black">✓</span>
              </motion.div>
              <div className="text-lg font-bold mb-2 text-white">Bid Submitted!</div>
              <div className="text-sm text-dark-muted mb-6">The poster will review your proposal</div>
              <button 
                onClick={() => router.push('/app')}
                className="bg-dark-card border border-dark-border text-white px-6 py-3 rounded-sm text-sm font-bold hover:border-meat-red/50"
              >
                Back to Bounties
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-dark-card border border-dark-border rounded-sm p-5 mb-6">
                <div className="text-xs text-dark-muted mb-2">{bounty.id}</div>
                <div className="text-base font-medium mb-3 text-white">{bounty.task || bounty.taskDescription}</div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-meat-orange">{bounty.reward || bounty.rewardUsdc} USDC</span>
                  <span className="text-xs text-dark-muted">reward</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-dark-muted mb-2 uppercase tracking-wider">Your Proposal</label>
                  <textarea
                    value={proposal}
                    onChange={(e) => setProposal(e.target.value)}
                    placeholder="Describe how you'll complete this task..."
                    className="w-full bg-dark-card border border-dark-border rounded-sm p-4 text-sm text-white placeholder-dark-muted resize-none focus:outline-none focus:border-meat-red/50"
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-dark-muted mb-2 uppercase tracking-wider">Your Price</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step={0.1}
                      min={0.1}
                      value={priceUsdc}
                      onChange={(e) => setPriceUsdc(e.target.value)}
                      className="flex-1 bg-dark-card border border-dark-border rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-meat-red/50"
                      required
                    />
                    <span className="text-sm text-dark-muted">USDC</span>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-meat text-black font-bold py-4 rounded-sm text-sm mt-4 glow-meat"
                >
                  {submitting ? 'Submitting...' : 'Submit Bid'}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}