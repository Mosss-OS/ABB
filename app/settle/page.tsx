'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Bounty {
  id: string;
  task: string;
  taskDescription?: string;
  reward: number;
  rewardUsdc?: number;
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
        body: JSON.stringify({ bountyId, resultUrl }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Payment failed');
        return;
      }
      
      setDone(true);
    } catch (err) {
      setError('Failed to settle bounty');
    }
    
    setSettling(false);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-dark-bg p-4 max-w-md mx-auto">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-meat rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-black">✓</span>
          </div>
          <div className="text-lg font-black text-white mb-2">Payment Settled!</div>
          <div className="text-sm text-dark-muted mb-6">The worker has been paid in USDC.</div>
          <Link href="/app" className="inline-block mt-6 bg-dark-card border border-dark-border text-white px-4 py-2 rounded-sm text-sm hover:border-meat-red/50">
            Back to Bounties
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg p-4 max-w-md mx-auto flex items-center justify-center">
        <div className="text-dark-muted">Loading...</div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-dark-bg p-4 max-w-md mx-auto flex items-center justify-center">
        <div className="text-dark-muted">Bounty not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/app" className="text-sm text-dark-muted hover:text-white">← Back</Link>
        <span className="font-bold text-sm text-white uppercase tracking-wide">Settle</span>
        <div className="w-12" />
      </div>

      <div className="bg-dark-card border border-dark-border rounded-sm p-4 mb-4">
        <div className="text-[10px] text-dark-muted mb-1">{bounty.id}</div>
        <div className="text-sm font-medium text-white">{bounty.task || bounty.taskDescription}</div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-sm p-4 mb-4">
        <div className="text-xs text-dark-muted mb-2 uppercase tracking-widest">Worker</div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-sm bg-gradient-meat flex items-center justify-center text-black text-sm font-bold">
            {bounty.workerUsername[0].toUpperCase()}
          </div>
          <span className="font-bold text-white">@{bounty.workerUsername}</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-meat-red/10 to-meat-orange/10 border border-meat-red/30 rounded-sm p-4 mb-4">
        <div className="text-xs text-meat-red mb-1 uppercase tracking-widest">Amount to Pay</div>
        <div className="text-3xl font-black text-gradient-meat">{bounty.reward || bounty.rewardUsdc} USDC</div>
      </div>

      {error && (
        <div className="bg-meat-red/10 text-meat-red text-sm p-3 rounded-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSettle} className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-2 text-dark-muted">Result URL (optional)</label>
          <input
            type="url"
            value={resultUrl}
            onChange={(e) => setResultUrl(e.target.value)}
            placeholder="Link to completed work..."
            className="w-full p-3 bg-dark-card border border-dark-border rounded-sm text-sm text-white placeholder-dark-muted focus:outline-none focus:border-meat-red/50"
          />
        </div>

        <button
          type="submit"
          disabled={settling}
          className="w-full bg-gradient-meat text-black py-3 rounded-sm font-bold disabled:opacity-50 glow-meat"
        >
          {settling ? 'Processing Payment...' : `Pay ${bounty.reward || bounty.rewardUsdc} USDC`}
        </button>
      </form>
    </div>
  );
}