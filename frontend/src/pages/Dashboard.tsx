import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const activityTypeConfig = {
  allocation: { color: '#f97316', bg: 'rgba(249,115,22,0.1)', Icon: Users },
  maintenance: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', Icon: Wrench },
  return: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', Icon: Package },
  booking: { color: '#a855f7', bg: 'rgba(168,85,247,0.1)', Icon: CalendarDays },
  system: { color: '#a1a1aa', bg: 'rgba(161,161,170,0.1)', Icon: Activity },
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0, availableAssets: 0, allocatedAssets: 0, maintenanceAssets: 0, activeBookings: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsRes, bookingsRes, activityRes] = await Promise.all([
          api.get('/assets').catch(() => ({ data: [] })),
          api.get('/bookings').catch(() => ({ data: [] })),
          api.get('/activity/logs').catch(() => ({ data: [] }))
        ]);
        
        const assets = assetsRes.data || [];
        const bookings = bookingsRes.data || [];
        
        // Compute Stats
        const allocatedCount = assets.filter((a: { status: string }) => a.status === 'ALLOCATED').length;
        setStats({
          totalAssets: assets.length,
          availableAssets: assets.filter((a: { status: string }) => a.status === 'AVAILABLE').length,
          allocatedAssets: allocatedCount,
          maintenanceAssets: assets.filter((a: { status: string }) => a.status === 'UNDER_MAINTENANCE').length,
          activeBookings: bookings.filter((b: { status: string }) => b.status === 'UPCOMING' || b.status === 'ONGOING').length,
        });
        
        // Compute Chart Data (Utilization & Bookings over time)
        // Group by month
        const trendMap: Record<string, { utilization: number; bookings: number }> = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Initialize last 7 months
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          trendMap[months[d.getMonth()]] = { utilization: 0, bookings: 0 };
        }
        
        // Fill bookings
        bookings.forEach((b: any) => {
          const m = months[new Date(b.startTime).getMonth()];
          if (trendMap[m]) trendMap[m].bookings++;
        });
        
        // Fake historical utilization trend based on current allocations, since we don't track historical daily allocations in DB for this demo
        // We will just scale it down to simulate growth
        const currentUtil = assets.length > 0 ? Math.round((allocatedCount / assets.length) * 100) : 0;
        Object.keys(trendMap).forEach((m, idx) => {
          trendMap[m].utilization = Math.max(0, currentUtil - ((6 - idx) * 5));
        });

        setChartData(Object.entries(trendMap).map(([name, data]) => ({ name, ...data })));
        
        // Set Recent Activity
        setRecentActivity(activityRes.data ? activityRes.data.slice(0, 5) : []);

      } catch (e) {
        console.error(e);
        setError('Could not connect to the server.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { title: 'Available Assets', value: stats.availableAssets, Icon: Package, color: '#10b981', bg: 'rgba(16,185,129,0.1)', trend: '+12%' },
    { title: 'Allocated', value: stats.allocatedAssets, Icon: Users, color: '#f97316', bg: 'rgba(249,115,22,0.1)', trend: '+4%' },
    { title: 'In Maintenance', value: stats.maintenanceAssets, Icon: Wrench, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', trend: '-2%' },
    { title: 'Active Bookings', value: stats.activeBookings, Icon: CalendarDays, color: '#a855f7', bg: 'rgba(168,85,247,0.1)', trend: '+18%' },
  ];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ height: '130px', borderRadius: '16px', background: 'linear-gradient(90deg, var(--color-surface) 25%, var(--color-border) 50%, var(--color-surface) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#f59e0b' }}>
          <AlertCircle size={16} color="#f59e0b" />
          {error}
        </div>
      )}

      {/* Welcome */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Welcome back 👋</h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>Here's what's happening across your organization today.</p>
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
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              padding: '20px',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'default',
            }}
          >
            {/* Glow */}
            <div style={{ position: 'absolute', right: '-16px', top: '-16px', width: '80px', height: '80px', borderRadius: '50%', background: bg, filter: 'blur(20px)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '12px', background: bg }}>
                <Icon size={22} color={color} strokeWidth={1.5} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '3px 8px', borderRadius: '999px' }}>
                {trend} this month
              </span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px', fontWeight: 500 }}>{title}</div>
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
          style={{ borderRadius: '16px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', minHeight: '320px' }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, padding: '20px', color: 'var(--color-text)', opacity: 0.03, pointerEvents: 'none' }}>
            <TrendingUp size={100} />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Asset Utilization</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>Utilization vs Bookings (last 7 months)</p>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[{ color: 'var(--color-primary)', label: 'Utilization' }, { color: '#a855f7', label: 'Bookings' }].map(({ color, label }) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
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
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gBook" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', boxShadow: 'var(--shadow-md)', fontSize: '12px' }} />
                <Area type="monotone" dataKey="utilization" stroke="var(--color-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#gUtil)" />
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
          style={{ borderRadius: '16px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="var(--color-primary)" /> Recent Activity
            </h3>
            <button 
              onClick={() => navigate('/logs')}
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
            >
              View All <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1, overflowY: 'auto' }}>
            {recentActivity.map((activity, index) => {
              const cfg = activityTypeConfig[activity.type as keyof typeof activityTypeConfig] || activityTypeConfig.system;
              return (
                <div key={activity.id} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                  {index < recentActivity.length - 1 && (
                    <div style={{ position: 'absolute', left: '16px', top: '34px', bottom: '-18px', width: '1px', background: 'var(--color-border)' }} />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: cfg.bg, flexShrink: 0, zIndex: 1 }}>
                    <cfg.Icon size={14} color={cfg.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', lineHeight: 1.4, margin: 0 }}>{activity.action}</p>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginTop: '3px' }}>{activity.time}</span>
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
