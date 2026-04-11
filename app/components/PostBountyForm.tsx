'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';

interface PostBountyFormProps {
  onSuccess?: (castHash: string) => void;
}

export default function PostBountyForm({ onSuccess }: PostBountyFormProps) {
  const { authenticated, user, login } = usePrivy();
  const [taskDescription, setTaskDescription] = useState('');
  const [taskType, setTaskType] = useState<'translate' | 'summarize' | 'onchain_lookup'>('translate');
  const [rewardUsdc, setRewardUsdc] = useState(1);
  const [deadlineHours, setDeadlineHours] = useState(24);
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
    setCastUrl('');

    try {
      const res = await fetch('/api/bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskDescription,
          taskType,
          rewardUsdc,
          deadlineHours,
          posterFid: user.farcaster.fid,
          posterUsername: user.farcaster.username,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to post bounty');
      }

      if (data.castHash) {
        setCastUrl(`https://warpcast.com/~/concentration?hash=${data.castHash}`);
        onSuccess?.(data.castHash);
      }

      setTaskDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-[#e5e7eb] p-6 bg-white shadow-sm">
      <div className="mb-6">
        <label className="block text-[10px] uppercase tracking-widest text-[#9ca3af] mb-2 font-black">Description.Input</label>
        <textarea
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          className="w-full border-2 border-[#f3f4f6] p-4 text-sm bg-[#f8f9fa] text-[#0b1c3d] focus:border-[#22d3ee] focus:outline-none transition-colors resize-none placeholder:text-[#d1d5db] font-bold"
          rows={3}
          placeholder="DESCRIBE_TASK_PARAMETERS..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#9ca3af] mb-2 font-black">Type.Select</label>
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value as typeof taskType)}
            className="w-full border-2 border-[#f3f4f6] p-4 text-xs bg-[#f8f9fa] text-[#0b1c3d] focus:border-[#22d3ee] focus:outline-none transition-colors uppercase font-black appearance-none"
          >
            <option value="translate">Translate</option>
            <option value="summarize">Summarize</option>
            <option value="onchain_lookup">On-chain Lookup</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#9ca3af] mb-2 font-black">Reward.Usdc</label>
          <input
            type="number"
            value={rewardUsdc}
            onChange={(e) => setRewardUsdc(parseFloat(e.target.value))}
            className="w-full border-2 border-[#f3f4f6] p-4 text-xs bg-[#f8f9fa] text-[#0b1c3d] focus:border-[#22d3ee] focus:outline-none transition-colors font-black"
            min={0.5}
            max={10}
            step={0.5}
          />
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-[10px] uppercase tracking-widest text-[#9ca3af] mb-2 font-black">Deadline.Interval</label>
        <select
          value={deadlineHours}
          onChange={(e) => setDeadlineHours(parseInt(e.target.value))}
          className="w-full border-2 border-[#f3f4f6] p-4 text-xs bg-[#f8f9fa] text-[#0b1c3d] focus:border-[#22d3ee] focus:outline-none transition-colors uppercase font-black appearance-none"
        >
          <option value={2}>2 HOURS</option>
          <option value={6}>6 HOURS</option>
          <option value={12}>12 HOURS</option>
          <option value={24}>24 HOURS</option>
        </select>
      </div>

      {error && <div className="text-[#ef4444] text-[9px] uppercase tracking-widest mb-4 font-black bg-[#fee2e2] p-3 border-l-4 border-[#ef4444]">SYS.ERROR: {error}</div>}

      {castUrl && (
        <a
          href={castUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#22d3ee] text-[10px] hover:text-[#0b1c3d] transition-colors uppercase tracking-[0.2em] mb-4 block font-black underline decoration-2 underline-offset-4"
        >
          TX_STATUS: VIEW_ON_WARPCAST ↗
        </a>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#0b1c3d] text-white py-5 text-[12px] font-black uppercase tracking-[0.3em] hover:bg-[#22d3ee] hover:text-black disabled:opacity-20 transition-all duration-300"
      >
        {loading ? 'POSTING_TO_PROTOCOL...' : 'EXECUTE_DEPLOY'}
      </button>
    </form>
  );
}
