import React, { useState, useEffect } from 'react';
import api from '../services/api';

type Category = 'All' | 'Alerts' | 'Approvals' | 'Bookings';

export const ActivityLogs: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<Category>('All');
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/activity/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter(n => filter === 'All' || n.category === filter);

  // Helper to render the colored square dot based on backend dotStyle
  const renderDot = (dotStyle: string) => {
    switch (dotStyle) {
      case 'solid-blue':
        return <div className="w-2.5 h-2.5 rounded-[2px] bg-[#3b82f6] flex-shrink-0 mt-1" />;
      case 'hollow-green':
        return <div className="w-2.5 h-2.5 rounded-[2px] border border-[#10b981] bg-transparent flex-shrink-0 mt-1" />;
      case 'hollow-red':
        return <div className="w-2.5 h-2.5 rounded-[2px] border border-[#ef4444] bg-[rgba(239,68,68,0.1)] flex-shrink-0 mt-1" />;
      case 'hollow-yellow':
        return <div className="w-2.5 h-2.5 rounded-[2px] border border-[#d97706] bg-[rgba(217,119,6,0.1)] flex-shrink-0 mt-1" />;
      default:
        return <div className="w-2.5 h-2.5 rounded-[2px] bg-[var(--color-border)] flex-shrink-0 mt-1" />;
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      
      {/* Filters Row */}
      <div className="flex gap-4 border-b border-[var(--color-border)] pb-4">
        {(['All', 'Alerts', 'Approvals', 'Bookings'] as Category[]).map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-6 py-1.5 rounded-md text-sm font-medium border transition-all
              ${filter === cat 
                ? 'border-[#10b981] text-[#10b981] bg-[rgba(16,185,129,0.05)]' 
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-gray-500 bg-transparent'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="flex flex-col">
        {isLoading ? (
          <div className="py-8 text-center text-[var(--color-text-muted)]">Loading feed...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-8 text-center text-[var(--color-text-muted)]">No items found for this category.</div>
        ) : (
          filteredNotifications.map((notif) => (
            <div 
              key={notif.id} 
              className="flex items-start justify-between py-4 border-b border-[var(--color-border)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors group"
            >
              <div className="flex items-start gap-3">
                {renderDot(notif.dotStyle)}
                <div className="text-[var(--color-text)] text-sm font-medium">
                  {notif.message}
                </div>
              </div>
              <div className="text-[var(--color-text-muted)] text-sm font-medium whitespace-nowrap ml-4">
                {notif.relativeTime}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
