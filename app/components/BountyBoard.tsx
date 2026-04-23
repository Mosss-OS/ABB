'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Bounty {
  id: string;
  task: string;
  taskDescription?: string;
  type: string;
  taskType?: string;
  reward: number;
  rewardUsdc?: number;
  status: string;
  deadlineTs: number;
  bidCount?: number;
}

const statusColors: Record<string, string> = {
  open: 'bg-green-500/20 text-green-400',
  assigned: 'bg-meat-orange/20 text-meat-orange',
  completed: 'bg-blue-500/20 text-blue-400',
  settled: 'bg-meat-red/20 text-meat-red',
};

const typeIcons: Record<string, string> = {
  translate: '🌐',
  summarize: '📝',
  'onchain-lookup': '⛓️',
  custom: '⚙️',
};

interface Bid {
  id: string;
  bountyId: string;
  agentFid: number;
  agentUsername: string;
  proposal: string;
  priceUsdc: number;
  status: string;
  createdAt: number;
}

export default function BountyBoard() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);

  useEffect(() => {
    fetch('/api/bounties')
      .then(res => res.json())
      .then(data => {
        setBounties(data.bounties || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredBounties = filter === 'all' 
    ? bounties 
    : bounties.filter(b => b.status === filter);

  const viewBids = async (bounty: Bounty) => {
    setSelectedBounty(bounty);
    setLoadingBids(true);
    try {
      const res = await fetch(`/api/bounties/${bounty.id}?includeBids=true`);
      const data = await res.json();
      setBids(data.bids || []);
    } catch (err) {
      console.error('Failed to fetch bids:', err);
    }
    setLoadingBids(false);
  };

  const selectWinner = async (bid: Bid) => {
    try {
      await fetch(`/api/bounties/${selectedBounty!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerBidId: bid.id,
          workerFid: bid.agentFid,
          workerUsername: bid.agentUsername,
        }),
      });
      setSelectedBounty(null);
      window.location.reload();
    } catch (err) {
      console.error('Failed to assign winner:', err);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg" />
        ))}
      </div>
    );
  }

  if (bounties.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🎯</div>
        <div className="text-[10px] text-gray-500">No bounties yet</div>
        <div className="text-[8px] text-gray-400 mt-1">Post the first one!</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 overflow-x-auto pb-2">
        {['all', 'open', 'assigned', 'completed', 'settled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-2 py-1 text-[8px] rounded-full whitespace-nowrap transition-colors ${
              filter === status 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

<div className="space-y-2">
        {filteredBounties.slice(0, 5).map(bounty => (
          <div 
            key={bounty.id} 
            className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs">{typeIcons[bounty.type || bounty.taskType || 'custom'] || '⚙️'}</span>
                  <span className="text-[10px] text-gray-400 truncate">
                    {bounty.id}
                  </span>
                </div>
                <div className="text-[10px] font-medium text-gray-900 truncate">
                  {bounty.task || bounty.taskDescription || 'No description'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-cyan-600">
                  {bounty.reward || bounty.rewardUsdc || 0} USDC
                </div>
                <span className={`inline-block px-1.5 py-0.5 text-[8px] rounded-full ${
                  statusColors[bounty.status] || 'bg-gray-100 text-gray-800'
                }`}>
                  {bounty.status}
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              {bounty.deadlineTs && (
                <div className="text-[8px] text-gray-400">
                  Due: {new Date(bounty.deadlineTs * 1000).toLocaleDateString()}
                </div>
              )}
              <div className="flex gap-2">
                {(bounty.bidCount ?? 0) > 0 && (
                  <button
                    onClick={() => viewBids(bounty)}
                    className="text-[8px] text-cyan-600 font-medium hover:underline"
                  >
                    {bounty.bidCount} bid{(bounty.bidCount ?? 0) !== 1 ? 's' : ''}
                  </button>
                )}
                {bounty.status === 'open' && (
                  <Link
                    href={`/submit-bid?bountyId=${bounty.id}`}
                    className="text-[8px] bg-cyan-600 text-white px-2 py-0.5 rounded hover:bg-cyan-700"
                  >
                    Bid
                  </Link>
                )}
                {bounty.status === 'assigned' && (
                  <Link
                    href={`/settle?bountyId=${bounty.id}`}
                    className="text-[8px] bg-purple-600 text-white px-2 py-0.5 rounded hover:bg-purple-700"
                  >
                    Pay & Settle
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBounties.length > 5 && (
        <div className="text-center text-[8px] text-gray-400">
          +{filteredBounties.length - 5} more
        </div>
      )}

      {selectedBounty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm">Bids for {selectedBounty.id}</h3>
                <button onClick={() => setSelectedBounty(null)} className="text-gray-500">✕</button>
              </div>
            </div>
            <div className="p-4">
              {loadingBids ? (
                <div className="text-center py-4 text-gray-500">Loading...</div>
              ) : bids.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No bids yet</div>
              ) : (
                <div className="space-y-3">
                  {bids.map(bid => (
                    <div key={bid.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-xs">@{bid.agentUsername}</div>
                        <div className="text-cyan-600 font-bold text-xs">{bid.priceUsdc} USDC</div>
                      </div>
                      <div className="text-[10px] text-gray-600 mb-2">{bid.proposal}</div>
                      {selectedBounty.status === 'open' && (
                        <button
                          onClick={() => selectWinner(bid)}
                          className="w-full bg-cyan-600 text-white text-[10px] py-1.5 rounded hover:bg-cyan-700"
                        >
                          Accept Bid
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}