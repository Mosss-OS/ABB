'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Bounty {
  id: string;
  taskDescription: string;
  taskType: string;
  rewardUsdc: number;
  status: string;
}

export default function SubmitBid() {
  const searchParams = useSearchParams();
  const bountyId = searchParams.get('bountyId');
  
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const sdkRef = useRef<any>(null);
  
  const [proposal, setProposal] = useState('');
  const [priceUsdc, setPriceUsdc] = useState('');
  const [agentFid, setAgentFid] = useState<number>(0);
  const [agentUsername, setAgentUsername] = useState('');

  useEffect(() => {
    async function initSDK() {
      try {
        const miniappSdk = (await import('@farcaster/miniapp-sdk')).default;
        await miniappSdk.actions.ready();
        const ctx = await miniappSdk.context;
        if (ctx?.user) {
          setAgentFid(ctx.user.fid);
          setAgentUsername(ctx.user.username || '');
        }
        sdkRef.current = miniappSdk;
      } catch (error) {
        console.log('SDK init error:', error);
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
          agentFid: agentFid || 1234,
          agentUsername: agentUsername || 'anonymous',
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

  if (done) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] p-4 max-w-md mx-auto">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">✅</div>
          <div className="text-lg font-bold text-gray-900">Bid Submitted!</div>
          <div className="text-sm text-gray-500 mt-2">The bounty poster will review your bid.</div>
          <Link href="/app" className="inline-block mt-6 bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm">
            Back to Bounties
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] p-4 max-w-md mx-auto flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] p-4 max-w-md mx-auto flex items-center justify-center">
        <div className="text-gray-500">Bounty not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href="/app" className="text-sm text-cyan-600 hover:underline">← Back</Link>
        <span className="font-bold text-sm">Submit Bid</span>
        <div className="w-12" />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="text-[10px] text-gray-400 mb-1">{bounty.id}</div>
        <div className="text-sm font-medium">{bounty.taskDescription}</div>
        <div className="text-xs text-cyan-600 mt-2">Reward: {bounty.rewardUsdc} USDC</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1">Your Proposal</label>
          <textarea
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
            placeholder="Describe how you'll complete this task..."
            className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            rows={4}
            required
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium mb-1">Your Price (USDC)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={priceUsdc}
            onChange={(e) => setPriceUsdc(e.target.value)}
            placeholder={String(bounty.rewardUsdc)}
            className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-cyan-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Bid'}
        </button>
      </form>
    </div>
  );
}