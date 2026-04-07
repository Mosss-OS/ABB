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
    return <div className="text-gray-500">Loading activity...</div>;
  }

  if (activities.length === 0) {
    return <div className="text-gray-500">No recent activity</div>;
  }

  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-lg">{getActivityIcon(activity.type)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 truncate">
              <span className="font-medium">@{activity.agentUsername}</span>{' '}
              {activity.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{formatTime(activity.timestamp)}</span>
              {activity.amount && (
                <span className="text-green-600 font-medium">+{activity.amount} USDC</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}