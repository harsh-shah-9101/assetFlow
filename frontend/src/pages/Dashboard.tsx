import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Package, Users, Wrench, CalendarDays } from 'lucide-react';
import api from '../services/api';

interface DashboardStats {
  totalAssets: number;
  availableAssets: number;
  allocatedAssets: number;
  maintenanceAssets: number;
  activeBookings: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    availableAssets: 0,
    allocatedAssets: 0,
    maintenanceAssets: 0,
    activeBookings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch assets to calculate stats (in a real app, you'd have a specific /api/dashboard endpoint)
        const assetsRes = await api.get('/assets');
        const assets = assetsRes.data;
        
        const available = assets.filter((a: any) => a.status === 'AVAILABLE').length;
        const allocated = assets.filter((a: any) => a.status === 'ALLOCATED').length;
        const maintenance = assets.filter((a: any) => a.status === 'UNDER_MAINTENANCE').length;
        
        setStats({
          totalAssets: assets.length,
          availableAssets: available,
          allocatedAssets: allocated,
          maintenanceAssets: maintenance,
          activeBookings: 0, // Placeholder
        });
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string | number, icon: any, colorClass: string }) => (
    <Card className="flex items-center p-6 border-l-4" style={{ borderLeftColor: colorClass }}>
      <div className="p-4 rounded-full mr-4" style={{ backgroundColor: `${colorClass}20`, color: colorClass }}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--color-text-muted)]">{title}</p>
        <h3 className="text-2xl font-bold text-[var(--color-text)] mt-1">{value}</h3>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Overview</h1>
          <p className="text-[var(--color-text-muted)]">Here's what's happening today.</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-[var(--color-border)] rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Available Assets" 
            value={stats.availableAssets} 
            icon={Package} 
            colorClass="var(--color-success)" 
          />
          <StatCard 
            title="Allocated Assets" 
            value={stats.allocatedAssets} 
            icon={Users} 
            colorClass="var(--color-primary)" 
          />
          <StatCard 
            title="In Maintenance" 
            value={stats.maintenanceAssets} 
            icon={Wrench} 
            colorClass="var(--color-warning)" 
          />
          <StatCard 
            title="Active Bookings" 
            value={stats.activeBookings} 
            icon={CalendarDays} 
            colorClass="var(--color-secondary)" 
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-96 flex items-center justify-center">
          <p className="text-[var(--color-text-muted)]">Recent Activity (To be implemented)</p>
        </Card>
        <Card className="h-96 flex items-center justify-center">
          <p className="text-[var(--color-text-muted)]">Overdue Returns (To be implemented)</p>
        </Card>
      </div>
    </div>
  );
};
