import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Users, Wrench, CalendarDays, TrendingUp, Activity, ArrowRight, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

interface DashboardStats {
  totalAssets: number;
  availableAssets: number;
  allocatedAssets: number;
  maintenanceAssets: number;
  activeBookings: number;
}

const chartData = [
  { name: 'Jan', utilization: 40, bookings: 24 },
  { name: 'Feb', utilization: 30, bookings: 13 },
  { name: 'Mar', utilization: 55, bookings: 38 },
  { name: 'Apr', utilization: 45, bookings: 30 },
  { name: 'May', utilization: 70, bookings: 48 },
  { name: 'Jun', utilization: 65, bookings: 38 },
  { name: 'Jul', utilization: 85, bookings: 55 },
];

const recentActivity = [
  { id: 1, action: 'MacBook Pro M3 allocated to Sarah Connor', time: '10 mins ago', type: 'allocation' },
  { id: 2, action: 'Dell XPS 15 marked for maintenance', time: '2 hours ago', type: 'maintenance' },
  { id: 3, action: "New asset 'Conference Screen' registered", time: '4 hours ago', type: 'system' },
  { id: 4, action: 'Projector returned by John Doe', time: '1 day ago', type: 'return' },
  { id: 5, action: 'Quarterly Audit completed', time: '2 days ago', type: 'system' },
];

const activityTypeConfig = {
  allocation: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', Icon: Users },
  maintenance: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', Icon: Wrench },
  return: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', Icon: Package },
  system: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', Icon: Activity },
};

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0, availableAssets: 0, allocatedAssets: 0, maintenanceAssets: 0, activeBookings: 12,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/assets');
        const assets = res.data;
        setStats({
          totalAssets: assets.length,
          availableAssets: assets.filter((a: { status: string }) => a.status === 'AVAILABLE').length,
          allocatedAssets: assets.filter((a: { status: string }) => a.status === 'ALLOCATED').length,
          maintenanceAssets: assets.filter((a: { status: string }) => a.status === 'UNDER_MAINTENANCE').length,
          activeBookings: 12,
        });
      } catch (e) {
        console.error(e);
        setError('Could not connect to the server. Showing demo data.');
        setStats({ totalAssets: 48, availableAssets: 24, allocatedAssets: 18, maintenanceAssets: 6, activeBookings: 12 });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { title: 'Available Assets', value: stats.availableAssets, Icon: Package, color: '#10b981', bg: 'rgba(16,185,129,0.1)', trend: '+12%' },
    { title: 'Allocated', value: stats.allocatedAssets, Icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', trend: '+4%' },
    { title: 'In Maintenance', value: stats.maintenanceAssets, Icon: Wrench, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', trend: '-2%' },
    { title: 'Active Bookings', value: stats.activeBookings, Icon: CalendarDays, color: '#a855f7', bg: 'rgba(168,85,247,0.1)', trend: '+18%' },
  ];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ height: '130px', borderRadius: '16px', background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          ))}
        </div>
        <style>{`@keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '100%' }}>
      {/* Error banner */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#854d0e' }}>
          <AlertCircle size={16} color="#ca8a04" />
          {error}
        </div>
      )}

      {/* Welcome */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>Welcome back 👋</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>Here's what's happening across your organization today.</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {statCards.map(({ title, value, Icon, color, bg, trend }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              cursor: 'default',
            }}
          >
            {/* Glow */}
            <div style={{ position: 'absolute', right: '-16px', top: '-16px', width: '80px', height: '80px', borderRadius: '50%', background: bg, filter: 'blur(20px)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '12px', background: bg }}>
                <Icon size={22} color={color} strokeWidth={1.5} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: '999px' }}>
                {trend} this month
              </span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', fontWeight: 500 }}>{title}</div>
          </motion.div>
        ))}
      </div>

      {/* Chart + Activity Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '16px', flex: 1 }}>
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ borderRadius: '16px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', minHeight: '320px' }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, padding: '20px', opacity: 0.04, pointerEvents: 'none' }}>
            <TrendingUp size={100} />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>Asset Utilization</h3>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>Utilization vs Bookings (last 7 months)</p>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[{ color: '#3b82f6', label: 'Utilization' }, { color: '#a855f7', label: 'Bookings' }].map(({ color, label }) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gUtil" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gBook" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                <Area type="monotone" dataKey="utilization" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#gUtil)" />
                <Area type="monotone" dataKey="bookings" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#gBook)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ borderRadius: '16px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="#3b82f6" /> Recent Activity
            </h3>
            <button style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
              View All <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1, overflowY: 'auto' }}>
            {recentActivity.map((activity, index) => {
              const cfg = activityTypeConfig[activity.type as keyof typeof activityTypeConfig] || activityTypeConfig.system;
              return (
                <div key={activity.id} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                  {index < recentActivity.length - 1 && (
                    <div style={{ position: 'absolute', left: '16px', top: '34px', bottom: '-18px', width: '1px', background: '#f3f4f6' }} />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: cfg.bg, flexShrink: 0, zIndex: 1 }}>
                    <cfg.Icon size={14} color={cfg.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#374151', lineHeight: 1.4, margin: 0 }}>{activity.action}</p>
                    <span style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginTop: '3px' }}>{activity.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
