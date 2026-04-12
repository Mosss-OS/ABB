'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';

interface PostBountyFormProps {
  onSuccess?: (castHash: string) => void;
}

export default function PostBountyForm({ onSuccess }: PostBountyFormProps) {
  const { authenticated, user, login } = usePrivy();
  const [taskDescription, setTaskDescription] = useState('');
  const [rewardUsdc, setRewardUsdc] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [castUrl, setCastUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticated || !user?.farcaster) {
      login();
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskDescription,
          taskType: 'translate',
          rewardUsdc,
          deadlineHours: 24,
          posterFid: user.farcaster.fid,
          posterUsername: user.farcaster.username,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      if (data.castHash) {
        setCastUrl(`https://warpcast.com/~/concentration?hash=${data.castHash}`);
        onSuccess?.(data.castHash);
      }
      setTaskDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        value={taskDescription}
        onChange={(e) => setTaskDescription(e.target.value)}
        className="w-full p-2 text-xs border border-[#e5e7eb]"
        placeholder="Task description..."
        required
      />
      <div className="flex gap-2">
        <input
          type="number"
          value={rewardUsdc}
          onChange={(e) => setRewardUsdc(parseFloat(e.target.value))}
          className="w-16 p-2 text-xs border border-[#e5e7eb]"
          min={0.5}
          step={0.5}
        />
        <span className="text-[8px] self-center">USDC</span>
      </div>
      {error && <div className="text-[10px] text-red-500">{error}</div>}
      {castUrl && (
        <a href={castUrl} target="_blank" className="text-[8px] text-[#22d3ee]">View cast ↗</a>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#0b1c3d] text-white py-2 text-[10px]"
      >
        {loading ? 'POSTING...' : 'POST BOUNTY'}
      </button>
    </form>
  );
}