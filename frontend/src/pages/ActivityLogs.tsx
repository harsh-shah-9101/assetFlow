import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, FileText, RefreshCw, Search, Filter, 
  Users, Wrench, Package, Activity, AlertCircle, CheckCircle2, Info, AlertTriangle 
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import api from '../services/api';

const mockNotifications = [
  { id: 'n1', title: 'Overdue Return Alert', message: 'Laptop AF-0114 expected return date (2026-07-10) is past. Currently held by Priya.', type: 'danger', time: '1 hour ago', category: 'return' },
  { id: 'n2', title: 'Maintenance Approved', message: 'Maintenance ticket for Projector AF-0092 approved by Asset Manager.', type: 'success', time: '3 hours ago', category: 'maintenance' },
  { id: 'n3', title: 'Asset Assigned', message: 'Dell XPS 15 (AF-0045) successfully assigned to Raj Kumar.', type: 'info', time: '5 hours ago', category: 'allocation' },
  { id: 'n4', title: 'Booking Confirmed', message: 'Meeting Room B2 booked for 10:00 AM - 11:00 AM today.', type: 'success', time: '6 hours ago', category: 'booking' },
  { id: 'n5', title: 'Transfer Request Approved', message: 'Transfer of MacBook Pro (AF-0012) from Sarah to John approved.', type: 'success', time: '1 day ago', category: 'transfer' },
  { id: 'n6', title: 'Audit Discrepancy Flagged', message: 'Office Chair (AF-0229) marked as missing during Q1 Audit.', type: 'warning', time: '2 days ago', category: 'audit' }
];

const mockActivityLogs = [
  { id: 'l1', action: 'Approved Asset Transfer', actor: 'John Doe', role: 'Asset Manager', target: 'MacBook Pro AF-0012', time: '2026-07-12 11:30 AM', type: 'transfer' },
  { id: 'l2', action: 'Raised Maintenance Request', actor: 'Sarah Connor', role: 'Employee', target: 'Keyboard AF-0490', time: '2026-07-12 10:15 AM', type: 'maintenance' },
  { id: 'l3', action: 'Registered New Asset', actor: 'John Doe', role: 'Asset Manager', target: 'Conference Screen AF-0105', time: '2026-07-12 09:00 AM', type: 'system' },
  { id: 'l4', action: 'Created Audit Cycle', actor: 'Jane Smith', role: 'Admin', target: 'Q1 Laptop Audit', time: '2026-07-11 04:30 PM', type: 'audit' },
  { id: 'l5', action: 'Promoted User Role', actor: 'Jane Smith', role: 'Admin', target: 'Raj Kumar to Department Head', time: '2026-07-11 02:15 PM', type: 'system' },
  { id: 'l6', action: 'Returned Asset', actor: 'Alice Cooper', role: 'Employee', target: 'iPad Air AF-0188', time: '2026-07-11 11:00 AM', type: 'return' },
  { id: 'l7', action: 'Approved Maintenance Request', actor: 'John Doe', role: 'Asset Manager', target: 'Projector AF-0092', time: '2026-07-11 10:00 AM', type: 'maintenance' },
  { id: 'l8', action: 'Booked Shared Resource', actor: 'Raj Kumar', role: 'Department Head', target: 'Meeting Room B2', time: '2026-07-11 09:30 AM', type: 'booking' }
];

export const ActivityLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'logs'>('notifications');
  const [notifications, setNotifications] = useState<any[]>(mockNotifications);
  const [logs, setLogs] = useState<any[]>(mockActivityLogs);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (activeTab === 'notifications') {
        const response = await api.get('/notifications').catch(() => null);
        if (response && response.data && response.data.length > 0) {
          setNotifications(response.data);
        } else {
          setNotifications(mockNotifications);
        }
      } else {
        const response = await api.get('/logs').catch(() => null);
        if (response && response.data && response.data.length > 0) {
          setLogs(response.data);
        } else {
          setLogs(mockActivityLogs);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Showing local logs/notifications feed.');
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
                    filteredLogs.map((log, index) => (
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
