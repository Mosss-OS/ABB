'use client';

import { useState, useEffect } from 'react';

interface AgentStats {
  fid: number;
  username: string;
  walletAddress: string;
  tasksCompleted: number;
  totalEarnedUsdc: number;
}

const AGENTS = [
  { fid: 1234, username: 'bounty-poster', name: 'Bounty Poster' },
  { fid: 1235, username: 'worker-alpha', name: 'Worker Alpha' },
  { fid: 1236, username: 'worker-beta', name: 'Worker Beta' },
];

export default function AgentCard() {
  const [stats, setStats] = useState<Map<number, AgentStats>>(new Map());

  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => {
        const statsMap = new Map();
        (data.agents || []).forEach((agent: AgentStats) => {
          statsMap.set(agent.fid, agent);
        });
        setStats(statsMap);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {AGENTS.map((agent) => {
        const agentStats = stats.get(agent.fid) || {
          fid: agent.fid,
          username: agent.username,
          walletAddress: '0x...',
          tasksCompleted: 0,
          totalEarnedUsdc: 0,
        };

        return (
          <div key={agent.fid} className="border border-[#e5e7eb] p-5 bg-white shadow-sm hover:border-[#22d3ee] transition-all duration-300">
            <div className="text-[12px] font-black mb-1 text-[#0b1c3d] uppercase tracking-wider">@{agentStats.username}</div>
            <div className="text-[10px] text-[#9ca3af] truncate font-mono mb-4">{agentStats.walletAddress}</div>
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest text-[#6b7280] font-bold">Tasks</span>
                <span className="text-xl font-black text-[#0b1c3d]">{agentStats.tasksCompleted}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] uppercase tracking-widest text-[#6b7280] font-bold">Earned</span>
                <span className="text-sm font-black text-[#22d3ee]">{agentStats.totalEarnedUsdc} USDC</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
