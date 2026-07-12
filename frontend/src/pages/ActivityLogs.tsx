import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, FileText, RefreshCw, Search, Filter, 
  Users, Wrench, Package, Activity, AlertCircle, CheckCircle2, Info, AlertTriangle 
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import api from '../services/api';

export const ActivityLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'logs'>('notifications');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'notifications') {
        const response = await api.get('/activity/notifications').catch(() => null);
        if (response && response.data) {
          setNotifications(response.data);
        } else {
          setNotifications([]);
        }
      } else {
        const response = await api.get('/activity/logs').catch(() => null);
        if (response && response.data) {
          setLogs(response.data);
        } else {
          setLogs([]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="text-red-500" size={18} />;
      case 'warning':
        return <AlertTriangle className="text-amber-500" size={18} />;
      case 'success':
        return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'info':
      default:
        return <Info className="text-blue-500" size={18} />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'danger':
        return 'rgba(239, 68, 68, 0.08)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.08)';
      case 'success':
        return 'rgba(16, 185, 129, 0.08)';
      case 'info':
      default:
        return 'rgba(59, 130, 246, 0.08)';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'allocation':
        return <Users size={14} className="text-orange-500" />;
      case 'maintenance':
        return <Wrench size={14} className="text-amber-500" />;
      case 'return':
        return <Package size={14} className="text-emerald-500" />;
      case 'audit':
        return <FileText size={14} className="text-purple-500" />;
      default:
        return <Activity size={14} className="text-zinc-400" />;
    }
  };

  const filteredNotifications = notifications.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || item.category === filterType;
    return matchesSearch && matchesFilter;
  });

  const filteredLogs = logs.filter(item => {
    const matchesSearch = item.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.target.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Activity Logs & Notifications</h1>
          <p className="text-[var(--color-text-muted)]">Monitor asset allocations, maintenance request states, return dates, and audits.</p>
        </div>
        <Button variant="ghost" onClick={fetchData} className="gap-2">
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      <Card>
        {/* Tab Headers */}
        <div className="border-b border-[var(--color-border)] flex overflow-x-auto">
          <button
            onClick={() => { setActiveTab('notifications'); setSearchTerm(''); setFilterType('all'); }}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Bell size={18} />
            Notifications Feed
            {notifications.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-primary)] text-white">
                {notifications.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('logs'); setSearchTerm(''); setFilterType('all'); }}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'logs'
                ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <FileText size={18} />
            System Audit Trail
          </button>
        </div>

        <CardContent className="p-6 space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                type="text"
                placeholder={activeTab === 'notifications' ? "Search alerts..." : "Search action, actor, or target..."}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-900/60 border border-zinc-800 rounded-lg text-[13px] text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="flex items-center gap-2 min-w-[150px]">
              <Filter className="text-zinc-500 w-4 h-4 shrink-0" />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Categories</option>
                <option value="allocation">Allocations</option>
                <option value="maintenance">Maintenance</option>
                <option value="return">Returns</option>
                <option value="booking">Bookings</option>
                <option value="audit">Audits</option>
                <option value="system">System Logs</option>
              </select>
            </div>
          </div>

          {/* List Content */}
          {activeTab === 'notifications' ? (
            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-[var(--color-text-muted)]">
                  No notifications match your filters.
                </div>
              ) : (
                filteredNotifications.map((notif, index) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{ backgroundColor: getNotificationBg(notif.type) }}
                    className="flex gap-4 p-4 rounded-xl border border-zinc-800/80 items-start hover:border-zinc-700/80 transition-colors"
                  >
                    <div className="mt-0.5 shrink-0">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-semibold text-sm text-[var(--color-text)]">{notif.title}</h4>
                        <span className="text-[11px] text-[var(--color-text-muted)] shrink-0">{notif.time}</span>
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{notif.message}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            /* Audit Log Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-background)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-xs uppercase tracking-wider">
                    <th className="p-4 font-medium">Event Type</th>
                    <th className="p-4 font-medium">Action</th>
                    <th className="p-4 font-medium">Actor</th>
                    <th className="p-4 font-medium">Target</th>
                    <th className="p-4 font-medium text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[var(--color-text-muted)]">
                        No audit logs found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr 
                        key={log.id} 
                        className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)] text-xs transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                              {getActivityIcon(log.type)}
                            </span>
                            <span className="capitalize font-medium text-[var(--color-text-muted)]">{log.type}</span>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-[var(--color-text)]">{log.action}</td>
                        <td className="p-4">
                          <div className="font-medium text-[var(--color-text)]">{log.actor}</div>
                          <div className="text-[10px] text-[var(--color-text-muted)]">{log.role}</div>
                        </td>
                        <td className="p-4 text-[var(--color-primary)] font-medium">{log.target}</td>
                        <td className="p-4 text-right text-[var(--color-text-muted)]">{log.time}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
