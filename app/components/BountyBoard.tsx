'use client';

import { useState, useEffect } from 'react';

interface Bounty {
  id: string;
  taskDescription: string;
  taskType: string;
  rewardUsdc: number;
  status: string;
  deadlineTs: number;
  winnerFid?: number;
  settlementTxHash?: string;
}

export default function BountyBoard() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBounties = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch('/api/bounties');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setBounties(data.bounties || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to load bounties');
      console.error('Failed to fetch bounties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBounties(true);
    const interval = setInterval(() => fetchBounties(false), 15000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-[#22d3ee]/10 text-[#22d3ee] border-[#22d3ee]/20';
      case 'assigned': return 'bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/20';
      case 'completed': return 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20';
      case 'expired': return 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20';
      default: return 'bg-[#6b7280]/10 text-[#6b7280] border-[#6b7280]/20';
    }
  };

  const formatDeadline = (deadlineTs: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = deadlineTs - now;
    if (diff <= 0) return 'EXPIRED';
    const hours = Math.floor(diff / 3600);
    if (hours < 1) return `${Math.floor(diff / 60)}M`;
    return `${hours}H`;
  };

  if (loading) {
    return <div className="text-[#6b7280] text-[10px] uppercase tracking-widest font-black">Syncing.Board...</div>;
  }

  if (error) {
    return (
      <div className="text-[#ef4444] text-[10px] uppercase tracking-widest font-black">
        <p>{error}</p>
        <button onClick={() => fetchBounties(true)} className="text-[#22d3ee] underline mt-2">
          RECONNECT
        </button>
      </div>
    );
  }

  if (bounties.length === 0) {
    return <div className="text-[#6b7280] text-[10px] uppercase tracking-widest font-black">Memory.Empty: No active bounties.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-[10px] text-[#9ca3af] uppercase tracking-[0.2em] mb-4 font-black">
        <span>Active_Slots: {bounties.length}</span>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span>Last_Sync: {lastUpdated.toLocaleTimeString()}</span>
          )}
          <button
            onClick={() => fetchBounties(false)}
            className="text-[#22d3ee] hover:text-[#0b1c3d] transition-colors"
          >
            FORCE_SYNC
          </button>
        </div>
      </div>
      {bounties.map((bounty) => (
        <div key={bounty.id} className="border border-[#e5e7eb] p-6 bg-white shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start mb-6">
            <span className={`px-2 py-1 border text-[10px] font-black tracking-[0.1em] ${getStatusColor(bounty.status)}`}>
              {bounty.status.toUpperCase()}
            </span>
            <div className="flex flex-col items-end">
               <span className="text-[9px] text-[#9ca3af] uppercase font-black mb-1">Reward</span>
               <span className="text-xl font-black text-[#0b1c3d] tracking-tighter">{bounty.rewardUsdc} USDC</span>
            </div>
          </div>
          <p className="text-lg text-[#0b1c3d] leading-[1.2] mb-6 font-bold uppercase tracking-tight">{bounty.taskDescription}</p>
          <div className="flex justify-between items-center text-[9px] text-[#9ca3af] uppercase tracking-[0.2em] font-black pt-4 border-t border-[#f8f9fa]">
            <span className="text-[#6b7280]">{bounty.taskType}</span>
            <div className="flex items-center gap-2">
               <span className="text-[#9ca3af]">Time.Left:</span>
               <span className="text-[#0b1c3d]">{formatDeadline(bounty.deadlineTs)}</span>
            </div>
          </div>
          {bounty.settlementTxHash && (
            <a
              href={`https://basescan.org/tx/${bounty.settlementTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#22d3ee] hover:text-[#0b1c3d] transition-colors uppercase tracking-widest mt-6 block font-black border-2 border-[#22d3ee]/20 hover:border-[#22d3ee] p-3 text-center"
            >
              Verify_On_Chain ↗
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
