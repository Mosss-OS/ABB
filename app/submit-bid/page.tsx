'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiDollarSign, FiCheck, FiArrowLeft, FiSend } from 'react-icons/fi';

interface Bounty {
  id: string;
  task: string;
  type: string;
  reward: number;
  status: string;
  posterUsername: string;
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
  
  const [proposal, setProposal] = useState('');
  const [priceUsdc, setPriceUsdc] = useState('1');

  useEffect(() => {
    async function initSDK() {
      try {
        const miniappSdk = (await import('@farcaster/miniapp-sdk')).default;
        await miniappSdk.actions.ready();
        const ctx = await miniappSdk.context;
        if (ctx?.user) {
          setUser({ fid: ctx.user.fid, username: ctx.user.username || '' });
        }
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
          setPriceUsdc(String(data.bounty.reward || 1));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bountyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bountyId) return;
    
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bountyId,
          agentFid: user.fid,
          agentUsername: user.username,
          proposal,
          priceUsdc: parseFloat(priceUsdc),
        }),
      });
      
      if (res.ok) {
        setDone(true);
      }
    } catch (e) {
      console.error(e);
    }
    
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center p-5">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#1C1C1E] rounded-3xl p-8 text-center max-w-sm w-full"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-16 h-16 bg-[#34C759] rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <FiCheck size={28} className="text-black" />
          </motion.div>
          <div className="text-lg font-semibold text-white mb-2">Bid Submitted!</div>
          <div className="text-sm text-white/60 mb-4">Wait for the poster to accept</div>
          <button 
            onClick={() => router.push('/app')}
            className="w-full bg-[#3A3A3C] text-white font-medium py-3 rounded-2xl text-sm"
          >
            Back to App
          </button>
        </motion.div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center">
        <div className="text-white/60">Bounty not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000]">
      <div className="max-w-md mx-auto p-5">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/60"
          >
            <FiArrowLeft size={20} />
            <span className="text-sm">Back</span>
          </button>
          <span className="text-sm font-semibold text-white">Place Bid</span>
          <div className="w-12" />
        </div>

        <div className="bg-[#2C2C2E] rounded-3xl p-5 mb-4">
          <div className="text-xs text-white/40 mb-2 font-medium">BOUNTY TASK</div>
          <div className="text-base font-medium">{bounty.task}</div>
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-sm text-white/60">Reward</span>
            <span className="text-lg font-semibold text-[#FF9500]">
              <FiDollarSign className="inline" size={16} />{bounty.reward} USDC
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/40 mb-2 block">Your Proposal</label>
            <textarea
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              placeholder="Describe how you'll complete this task..."
              className="w-full bg-[#2C2C2E] rounded-2xl p-4 text-sm text-white placeholder-white/30 resize-none"
              rows={4}
              required
            />
          </div>
          
          <div>
            <label className="text-xs text-white/40 mb-2 block">Your Price (USDC)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priceUsdc}
                onChange={(e) => setPriceUsdc(e.target.value)}
                step={0.1}
                min={0.1}
                className="bg-[#2C2C2E] rounded-2xl px-4 py-3 text-lg font-semibold text-white w-24"
              />
              <span className="text-sm text-white/40">USDC</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-[#FF9500] to-[#FF3B30] text-black font-semibold py-4 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FiSend size={18} />
            {submitting ? 'Submitting...' : 'Submit Bid'}
          </button>
        </form>
      </div>
    </div>
  );
}