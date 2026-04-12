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

export default function BountyBoard() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bounties')
      .then(res => res.json())
      .then(data => {
        setBounties(data.bounties || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-[10px] text-[#6b7280]">Loading...</div>;
  }

  if (bounties.length === 0) {
    return <div className="text-[10px] text-[#6b7280]">No bounties</div>;
  }

  return (
    <div className="space-y-2">
      {bounties.slice(0, 5).map((bounty) => (
        <div key={bounty.id} className="p-2 bg-[#f8f9fa] text-[10px]">
          <div className="flex justify-between">
            <span className="font-medium truncate max-w-[150px]">{bounty.taskDescription}</span>
            <span className="text-[#22d3ee]">{bounty.rewardUsdc} USDC</span>
          </div>
        </div>
      ))}
    </div>
  );
}