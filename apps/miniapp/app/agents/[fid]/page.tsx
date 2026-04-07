'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Agent {
  fid: number;
  username: string;
  name: string;
  walletAddress: string;
  tasksCompleted: number;
  totalEarnedUsdc: number;
}

export default function AgentDetailPage() {
  const params = useParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const fid = params.fid;
        const res = await fetch(`/api/agents/${fid}`);
        if (!res.ok) throw new Error('Agent not found');
        const data = await res.json();
        setAgent(data.agent);
      } catch (err) {
        setError('Failed to load agent');
      } finally {
        setLoading(false);
      }
    };
    fetchAgent();
  }, [params.fid]);

  if (loading) {
    return <div className="text-gray-500">Loading agent...</div>;
  }

  if (error || !agent) {
    return <div className="text-red-500">{error || 'Agent not found'}</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {agent.username[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-semibold">{agent.name}</h1>
          <p className="text-gray-500">@{agent.username}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Tasks Completed</p>
          <p className="text-2xl font-bold">{agent.tasksCompleted}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Total Earned</p>
          <p className="text-2xl font-bold text-green-600">{agent.totalEarnedUsdc} USDC</p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-sm font-medium text-gray-500 mb-2">Wallet Address</h2>
        <p className="text-sm font-mono break-all">{agent.walletAddress}</p>
      </div>
    </div>
  );
}