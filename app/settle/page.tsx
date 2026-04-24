'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiDollarSign, FiCheck, FiArrowLeft, FiLink } from 'react-icons/fi';

interface Bounty {
  id: string;
  task: string;
  reward: number;
  workerUsername: string;
  workerFid: number;
  status: string;
}

export default function SettleBounty() {
  const searchParams = useSearchParams();
  const bountyId = searchParams.get('bountyId');
  
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [resultUrl, setResultUrl] = useState('');

  useEffect(() => {
    if (!bountyId) return;
    
    fetch(`/api/bounties/${bountyId}`)
      .then(res => res.json())
      .then(data => {
        if (data.bounty) {
          setBounty(data.bounty);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bountyId]);

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bountyId) return;
    
    setSettling(true);
    setError('');
    
    try {
      const res = await fetch('/api/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bountyId, 
          resultUrl,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to settle');
        setSettling(false);
        return;
      }
      
      setDone(true);
    } catch (err) {
      setError('Failed to settle bounty');
    }
    
    setSettling(false);
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
          <div className="text-lg font-semibold text-white mb-2">Work Complete!</div>
          <div className="text-sm text-white/60 mb-4">Task marked as done</div>
          <Link 
            href="/app" 
            className="block w-full bg-[#3A3A3C] text-white font-medium py-3 rounded-2xl text-sm"
          >
            Back to App
          </Link>
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
          <Link href={`/bounties/${bountyId}`} className="flex items-center gap-2 text-white/60">
            <FiArrowLeft size={20} />
            <span className="text-sm">Back</span>
          </Link>
          <span className="text-sm font-semibold text-white">Complete Work</span>
          <div className="w-12" />
        </div>

        <div className="bg-[#2C2C2E] rounded-3xl p-5 mb-4">
          <div className="text-xs text-white/40 mb-2 font-medium">TASK</div>
          <div className="text-base font-medium">{bounty.task}</div>
        </div>

        <div className="bg-[#2C2C2E] rounded-3xl p-5 mb-4">
          <div className="text-xs text-white/40 mb-3 font-medium">WORKER</div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FF9500] to-[#FF3B30] flex items-center justify-center text-black font-semibold text-lg">
              {bounty.workerUsername[0].toUpperCase()}
            </div>
            <span className="font-semibold text-white">@{bounty.workerUsername}</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#34C759]/20 to-[#34C759]/5 rounded-3xl p-5 mb-4">
          <div className="text-xs text-[#34C759] mb-2 font-medium">REWARD</div>
          <div className="text-3xl font-bold text-[#34C759]">
            <FiDollarSign className="inline" size={24} />{bounty.reward}
            <span className="text-sm font-normal text-white/40 ml-1">USDC</span>
          </div>
        </div>

        {error && (
          <div className="bg-[#FF3B30]/15 text-[#FF3B30] text-sm p-4 rounded-2xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSettle} className="space-y-4">
          <div>
            <label className="text-xs text-white/40 mb-2 block">Result Link (optional)</label>
            <div className="relative">
              <FiLink className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input
                type="url"
                value={resultUrl}
                onChange={(e) => setResultUrl(e.target.value)}
                placeholder="https://..."
                className="w-full pl-10 pr-4 py-4 bg-[#2C2C2E] rounded-2xl text-sm text-white placeholder-white/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={settling}
            className="w-full bg-gradient-to-r from-[#FF9500] to-[#FF3B30] text-black font-semibold py-4 rounded-2xl disabled:opacity-50"
          >
            {settling ? 'Completing...' : 'Complete Work'}
          </button>
        </form>
      </div>
    </div>
  );
}