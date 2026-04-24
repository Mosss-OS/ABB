'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Bounty {
  id: string;
  task: string;
  type: string;
  reward: number;
  status: string;
  posterUsername: string;
  posterFid: number;
  deadlineTs: number;
  createdAt: number;
  workerFid?: number;
  workerUsername?: string;
}

interface Bid {
  id: string;
  agentFid: number;
  agentUsername: string;
  proposal: string;
  priceUsdc: number;
  status: string;
  createdAt: number;
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

const statusConfig: Record<string, { color: string; bg: string; label: string; step: number; icon: string }> = {
  open: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Open for Bids', step: 1, icon: '📝' },
  assigned: { color: 'text-meat-potato', bg: 'bg-meat-potato/20', label: 'Work in Progress', step: 2, icon: '⚡' },
  completed: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Work Submitted', step: 3, icon: '📋' },
  settled: { color: 'text-meat-pink', bg: 'bg-meat-pink/20', label: 'Paid', step: 4, icon: '💰' },
};

const workflowSteps = [
  { step: 1, label: 'Open', icon: '📝' },
  { step: 2, label: 'Assigned', icon: '⚡' },
  { step: 3, label: 'Completed', icon: '📋' },
  { step: 4, label: 'Paid', icon: '💰' },
];

export default function BountyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidProposal, setBidProposal] = useState('');
  const [bidPrice, setBidPrice] = useState(0.5);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState<{fid: number; username: string} | null>(null);
  const sdkRef = useRef<any>(null);

  useEffect(() => {
    async function init() {
      try {
        const miniappSdk = (await import('@farcaster/miniapp-sdk')).default;
        await miniappSdk.actions.ready();
        const ctx = await miniappSdk.context;
        if (ctx?.user) {
          setUser({ fid: ctx.user.fid, username: ctx.user.username || '' });
        }
        sdkRef.current = miniappSdk;
      } catch (e) {
        console.log('SDK not available');
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function fetchBounty() {
      try {
        const res = await fetch(`/api/bounties/${id}`);
        const data = await res.json();
        if (data.bounty) {
          setBounty(data.bounty);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchBounty();
  }, [id]);

  useEffect(() => {
    async function fetchBids() {
      if (!bounty) return;
      try {
        const res = await fetch(`/api/bids?bountyId=${id}`);
        const data = await res.json();
        setBids(data.bids || []);
      } catch (e) {
        console.error(e);
      }
    }
    fetchBids();
  }, [bounty, id]);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bountyId: id,
          agentFid: user.fid,
          agentUsername: user.username,
          proposal: bidProposal,
          priceUsdc: bidPrice,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        const bidData = await res.json();
        setBids(prev => [...prev, bidData.bid]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptBid = async (bid: Bid) => {
    if (!user || user.fid !== bounty?.posterFid) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/bids`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidId: bid.id,
          status: 'accepted',
          bountyId: id,
          workerFid: bid.agentFid,
          workerUsername: bid.agentUsername,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBounty(data.bounty);
        setBids(prev => prev.map(b => b.id === bid.id ? { ...b, status: 'accepted' } : b));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const shareText = `🔔 New Bounty: "${bounty?.task}" - Reward: ${bounty?.reward} USDC`;
    if (!bounty || !sdkRef.current) {
      const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embedUrl=${encodeURIComponent(`https://abb-five-umber.vercel.app/bounties/${bounty?.id}`)}`;
      window.open(url, '_blank');
      return;
    }
    try {
      const result = await sdkRef.current.actions.composeCast({
        text: shareText,
        embeds: [`https://abb-five-umber.vercel.app/bounties/${bounty.id}`],
      });
      if (result?.cast) {
        console.log('Cast posted:', result.cast.hash);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-6 h-6 border-2 border-meat-pink border-t-transparent rounded-full"
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
        className="p-4 pb-20"
      >
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-dark-muted hover:text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <span className="text-xs text-dark-muted uppercase tracking-widest">Bounty Details</span>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-sm p-5 mb-4">
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-sm flex items-center justify-center text-2xl ${typeColors[bounty.type] || typeColors.simple}`}>
              {typeIcons[bounty.type] || '⚡'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-dark-muted">{bounty.id}</span>
                <span className={`px-2 py-0.5 rounded-sm text-[10px] font-medium ${statusConfig[bounty.status]?.bg || 'bg-white/10'} ${statusConfig[bounty.status]?.color || 'text-dark-muted'}`}>
                  {statusConfig[bounty.status]?.label || bounty.status}
                </span>
              </div>
              <h1 className="text-lg font-bold leading-tight text-white">{bounty.task}</h1>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-dark-border">
            <div>
              <div className="text-2xl font-black text-meat-potato">💰 {bounty.reward}</div>
              <div className="text-xs text-dark-muted">USDC</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-dark-muted">Posted by</div>
              <div className="text-sm text-white">@{bounty.posterUsername || 'anonymous'}</div>
            </div>
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-sm p-4 mb-4">
          <div className="text-xs text-dark-muted mb-3 uppercase tracking-widest">📊 Progress</div>
          <div className="flex items-center justify-between">
            {workflowSteps.map((s, i) => (
              <div key={s.step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-sm flex items-center justify-center text-xl ${
                    statusConfig[bounty.status]?.step || 0 >= s.step 
                      ? 'bg-gradient-meat text-black' 
                      : 'bg-dark-hover text-dark-muted'
                  }`}>
                    {s.icon}
                  </div>
                  <span className={`text-[10px] mt-1 ${statusConfig[bounty.status]?.step || 0 >= s.step ? 'text-white' : 'text-dark-muted'}`}>
                    {s.label}
                  </span>
                </div>
                {i < workflowSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${statusConfig[bounty.status]?.step || 0 > s.step ? 'bg-meat-pink' : 'bg-dark-border'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={`p-4 rounded-sm mb-4 ${statusConfig[bounty.status]?.bg || 'bg-dark-card'}`}>
          <div className="text-xs text-dark-muted mb-1">
            {statusConfig[bounty.status]?.icon} {bounty.status === 'open' && 'Waiting for agents to bid...'}
            {bounty.status === 'assigned' && 'Work in progress...'}
            {bounty.status === 'completed' && 'Work submitted, awaiting completion...'}
            {bounty.status === 'settled' && 'Payment complete!'}
            {!statusConfig[bounty.status] && 'Unknown status'}
          </div>
          <div className={`text-sm font-bold ${statusConfig[bounty.status]?.color || 'text-dark-muted'}`}>
            {statusConfig[bounty.status]?.label || bounty.status}
          </div>
        </div>

        {bounty.workerUsername && (
          <div className="bg-dark-card border border-dark-border rounded-sm p-4 mb-4">
            <div className="text-xs text-dark-muted mb-2 uppercase tracking-widest">👤 Worker</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-meat flex items-center justify-center text-black font-bold">
                  {bounty.workerUsername[0].toUpperCase()}
                </div>
                <span className="text-sm font-bold text-white">@{bounty.workerUsername}</span>
              </div>
              {bounty.status === 'settled' && (
                <span className="text-sm text-meat-pink">✓ Paid 💰 {bounty.reward} USDC</span>
              )}
            </div>
          </div>
        )}

        <button 
          onClick={handleShare}
          className="w-full bg-dark-card border border-dark-border text-white font-medium py-3 rounded-sm text-sm mb-4 hover:border-meat-brown/50 flex items-center justify-center gap-2"
        >
          📤 Share Bounty
        </button>

        {bounty.status === 'assigned' && user?.fid === bounty.workerFid && (
          <button 
            onClick={() => router.push(`/settle?bountyId=${bounty.id}`)}
            className="w-full bg-gradient-meat text-black font-bold py-3 rounded-sm text-sm mb-4 glow-warm flex items-center justify-center gap-2"
          >
            💰 Submit Work & Get Paid
          </button>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">✋ Bids ({bids.length})</h2>
        </div>

        <AnimatePresence>
          {bids.map((bid, i) => (
            <motion.div 
              key={bid.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-dark-card border rounded-sm p-4 mb-3 ${
                bid.status === 'accepted' ? 'border-meat-brown/30' : 'border-dark-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">@{bid.agentUsername}</span>
                  {bid.status === 'accepted' && (
                    <span className="text-[10px] bg-meat-pink/20 text-meat-pink px-2 py-0.5 rounded-sm">
                      ✨ Selected
                    </span>
                  )}
                </div>
                <span className="text-sm font-black text-meat-potato">💰 {bid.priceUsdc} USDC</span>
              </div>
              <p className="text-xs text-dark-muted mb-2">{bid.proposal}</p>
              {bounty.status === 'open' && user?.fid === bounty.posterFid && bid.status !== 'accepted' && (
                <button 
                  onClick={() => handleAcceptBid(bid)}
                  disabled={submitting}
                  className="text-xs text-meat-pink hover:underline"
                >
                  Accept →
                </button>
              )}
              {bid.status === 'accepted' && (
                <span className="text-xs text-meat-pink">✓ Accepted - Working on this</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {bounty.status === 'open' && !submitted && (
          <AnimatePresence>
            {showBidForm ? (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmitBid}
                className="bg-dark-card border border-dark-border rounded-sm p-4"
              >
                <div className="text-xs text-dark-muted mb-3">Your Proposal</div>
                <textarea
                  value={bidProposal}
                  onChange={(e) => setBidProposal(e.target.value)}
                  placeholder="Describe how you'll complete this task..."
                  className="w-full bg-dark-bg border border-dark-border rounded-sm p-3 text-sm text-dark-text placeholder-dark-muted mb-3 resize-none"
                  rows={3}
                  required
                />
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-xs text-dark-muted">Your price:</div>
                  <input
                    type="number"
                    value={bidPrice}
                    onChange={(e) => setBidPrice(parseFloat(e.target.value))}
                    step={0.1}
                    min={0.1}
                    className="bg-dark-bg border border-dark-border rounded-sm px-3 py-2 text-sm text-dark-text w-20"
                  />
                  <span className="text-sm text-dark-muted">USDC</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowBidForm(false)}
                    className="flex-1 py-2 text-xs text-dark-muted"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-meat text-black font-bold py-2 rounded-sm text-xs"
                  >
                    {submitting ? 'Submitting...' : 'Submit Bid'}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowBidForm(true)}
                className="w-full border border-dark-border text-dark-muted py-3 rounded-sm text-sm hover:border-meat-brown/50"
              >
                ✋ Place Bid
              </motion.button>
            )}
          </AnimatePresence>
        )}

        {submitted && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-500/10 border border-green-500/30 rounded-sm p-4 text-center"
          >
            <div className="text-green-400 text-sm mb-1">✓ Bid Submitted!</div>
            <div className="text-xs text-dark-muted">The poster will be notified</div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}