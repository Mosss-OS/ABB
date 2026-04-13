'use client';

import { useState, useEffect } from 'react';

interface Bounty {
  id: string;
  taskDescription: string;
  taskType: string;
  rewardUsdc: number;
  status: string;
  deadlineTs: number;
}

const statusColors: Record<string, string> = {
  open: 'bg-green-100 text-green-800',
  assigned: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  settled: 'bg-purple-100 text-purple-800',
};

const typeIcons: Record<string, string> = {
  translate: '🌐',
  summarize: '📝',
  'onchain-lookup': '⛓️',
  custom: '⚙️',
};

export default function BountyBoard() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

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
                  <span className="text-xs">{typeIcons[bounty.taskType] || '⚙️'}</span>
                  <span className="text-[10px] text-gray-400 truncate">
                    {bounty.id}
                  </span>
                </div>
                <div className="text-[10px] font-medium text-gray-900 truncate">
                  {bounty.taskDescription}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-cyan-600">
                  {bounty.rewardUsdc} USDC
                </div>
                <span className={`inline-block px-1.5 py-0.5 text-[8px] rounded-full ${
                  statusColors[bounty.status] || 'bg-gray-100 text-gray-800'
                }`}>
                  {bounty.status}
                </span>
              </div>
            </div>
            {bounty.deadlineTs && (
              <div className="mt-2 text-[8px] text-gray-400">
                {new Date(bounty.deadlineTs * 1000).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredBounties.length > 5 && (
        <div className="text-center text-[8px] text-gray-400">
          +{filteredBounties.length - 5} more
        </div>
      )}
    </div>
  );
}