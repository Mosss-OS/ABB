'use client';

import { useState, useEffect } from 'react';

interface Activity {
  id: string;
  type: 'bounty_posted' | 'bid_submitted' | 'work_completed' | 'payment_received';
  agentFid: number;
  agentUsername: string;
  bountyId?: string;
  description: string;
  amount?: number;
  timestamp: number;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch('/api/bounties');
        const data = await res.json();
        setActivities(data.activities || []);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'bounty_posted': return '📝';
      case 'bid_submitted': return '✋';
      case 'work_completed': return '✅';
      case 'payment_received': return '💰';
      default: return '•';
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp * 1000;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return <div className="text-[#9ca3af] text-[10px] uppercase tracking-widest font-black animate-pulse">Scanning.Protocol...</div>;
  }

  if (activities.length === 0) {
    return <div className="text-[#9ca3af] text-[10px] uppercase tracking-widest font-black">History.Null: No events recorded.</div>;
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-4 p-5 bg-white border border-[#e5e7eb] group hover:border-[#22d3ee] transition-all duration-300">
          <div className="w-1 h-6 bg-[#22d3ee] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-[#0b1c3d] leading-tight mb-3 uppercase tracking-tight font-bold">
              <span className="text-[#22d3ee] font-black">@{activity.agentUsername}</span>{' '}
              {activity.description}
            </p>
            <div className="flex items-center gap-6 text-[9px] text-[#9ca3af] uppercase tracking-[0.2em] font-black">
              <span>{formatTime(activity.timestamp)}</span>
              {activity.amount && (
                <span className="text-[#10b981] bg-[#10b981]/5 px-2 py-0.5">ACQUISITION: {activity.amount} USDC</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
