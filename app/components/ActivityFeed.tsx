'use client';

import { useState, useEffect } from 'react';

interface Activity {
  id: string;
  type: string;
  agentFid: number;
  agentUsername: string;
  bountyId?: string;
  description: string;
  amount?: number;
  timestamp: number;
}

const typeIcons: Record<string, string> = {
  bounty_created: '📋',
  bid_submitted: '✋',
  task_executed: '✅',
  bounty_settled: '💰',
  bounty_assigned: '🎯',
};

const typeColors: Record<string, string> = {
  bounty_created: 'bg-blue-50 border-blue-200',
  bid_submitted: 'bg-yellow-50 border-yellow-200',
  task_executed: 'bg-green-50 border-green-200',
  bounty_settled: 'bg-cyan-50 border-cyan-200',
  bounty_assigned: 'bg-purple-50 border-purple-200',
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bounties')
      .then(res => res.json())
      .then(data => {
        setActivities(data.activities || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp * 1000;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-3xl mb-2">📭</div>
        <div className="text-xs text-gray-400">No activity yet</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.slice(0, 10).map((activity) => (
        <div 
          key={activity.id} 
          className={`flex items-center gap-3 p-3 rounded-lg border ${typeColors[activity.type] || 'bg-gray-50 border-gray-100'}`}
        >
          <span className="text-lg">{typeIcons[activity.type] || '•'}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-900 truncate">
              {activity.description}
            </div>
            <div className="text-[10px] text-gray-500">
              @{activity.agentUsername} · {formatTime(activity.timestamp)}
            </div>
          </div>
          {activity.amount && (
            <div className="text-xs font-bold text-cyan-600">
              +{activity.amount} USDC
            </div>
          )}
        </div>
      ))}
    </div>
  );
}