import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, BarChart3, PieChart as PieIcon, CalendarDays, Wrench, 
  Download, Printer, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import api from '../services/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Reports: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Dynamic Data
  const [assets, setAssets] = useState<any[]>([]);

  // KPI States
  const [kpis, setKpis] = useState({
    utilizationRate: 0,
    totalActiveAssets: 0,
    pendingMaintenance: 0,
    activeBookings: 0,
  });

  // Chart Data States
  const [utilizationData, setUtilizationData] = useState<any[]>([]);
  const [maintenanceData, setMaintenanceData] = useState<any[]>([]);
  const [deptAllocationData, setDeptAllocationData] = useState<any[]>([]);
  const [bookingTrendData, setBookingTrendData] = useState<any[]>([]);
  const [retirementAssets, setRetirementAssets] = useState<any[]>([]);

  const COLORS = ['#f97316', '#a855f7', '#10b981', '#3b82f6', '#ef4444', '#f59e0b'];

  const fetchReportData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [assetsRes, allocsRes, bookingsRes, maintRes, catsRes, deptsRes] = await Promise.all([
        api.get('/assets').catch(() => ({ data: [] })),
        api.get('/allocations').catch(() => ({ data: [] })),
        api.get('/bookings').catch(() => ({ data: [] })),
        api.get('/maintenance').catch(() => ({ data: [] })),
        api.get('/categories').catch(() => ({ data: [] })),
        api.get('/departments').catch(() => ({ data: [] })),
      ]);

      const fetchedAssets = assetsRes.data;
      const fetchedAllocs = allocsRes.data;
      const fetchedBookings = bookingsRes.data;
      const fetchedMaint = maintRes.data;
      const fetchedCats = catsRes.data;
      const fetchedDepts = deptsRes.data;

      setAssets(fetchedAssets);

      calculateMetrics(fetchedAssets, fetchedAllocs, fetchedBookings, fetchedMaint, fetchedCats, fetchedDepts);
    } catch (err) {
      console.error('Error fetching reports data', err);
      setErrorMsg('Could not fetch real-time database metrics. Showing demo dashboard.');
      loadDemoData();
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMetrics = (
    allAssets: any[], 
    _allAllocs: any[], 
    allBookings: any[], 
    allMaint: any[], 
    allCats: any[], 
    allDepts: any[]
  ) => {
    // 1. Calculate KPIs
    const activeAssets = allAssets.filter(a => a.status !== 'LOST' && a.status !== 'RETIRED' && a.status !== 'DISPOSED');
    const allocatedCount = activeAssets.filter(a => a.status === 'ALLOCATED').length;
    const utilizationRate = activeAssets.length > 0 ? Math.round((allocatedCount / activeAssets.length) * 100) : 0;
    const pendingMaint = allMaint.filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS').length;
    const activeBookCount = allBookings.filter(b => b.status === 'UPCOMING' || b.status === 'ONGOING').length;

    setKpis({
      utilizationRate,
      totalActiveAssets: activeAssets.length,
      pendingMaintenance: pendingMaint,
      activeBookings: activeBookCount,
    });

    // 2. Asset Utilization by Category
    const catMap: Record<string, { name: string; allocated: number; available: number; maintenance: number }> = {};
    allCats.forEach(c => {
      catMap[c.id] = { name: c.name, allocated: 0, available: 0, maintenance: 0 };
    });

    allAssets.forEach(asset => {
      if (!catMap[asset.categoryId]) {
        catMap[asset.categoryId] = { 
          name: asset.category?.name || 'Other', 
          allocated: 0, 
          available: 0, 
          maintenance: 0 
        };
      }
      if (asset.status === 'ALLOCATED') catMap[asset.categoryId].allocated++;
      else if (asset.status === 'AVAILABLE') catMap[asset.categoryId].available++;
      else if (asset.status === 'UNDER_MAINTENANCE') catMap[asset.categoryId].maintenance++;
    });
    setUtilizationData(Object.values(catMap));

    // 3. Maintenance Tickets by Category
    const maintMap: Record<string, { name: string; value: number }> = {};
    allMaint.forEach(m => {
      const catName = m.asset?.category?.name || 'Uncategorized';
      if (!maintMap[catName]) maintMap[catName] = { name: catName, value: 0 };
      maintMap[catName].value++;
    });
    setMaintenanceData(Object.values(maintMap));

    // 4. Department Allocations
    const deptMap: Record<string, { name: string; value: number }> = {};
    allDepts.forEach(d => {
      deptMap[d.id] = { name: d.name, value: 0 };
    });
    allAssets.forEach(asset => {
      if (asset.status === 'ALLOCATED' && asset.departmentId) {
        if (!deptMap[asset.departmentId]) {
          deptMap[asset.departmentId] = { name: asset.department?.name || 'Unknown', value: 0 };
        }
        deptMap[asset.departmentId].value++;
      }
    });
    setDeptAllocationData(Object.values(deptMap).filter(d => d.value > 0));

    // 5. Bookings Trend (by category of resource)
    const bookingTrendMap: Record<string, { name: string; bookings: number }> = {};
    allBookings.forEach(b => {
      const dateStr = new Date(b.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!bookingTrendMap[dateStr]) bookingTrendMap[dateStr] = { name: dateStr, bookings: 0 };
      bookingTrendMap[dateStr].bookings++;
    });
    // sort and take last 7 days
    const trendSorted = Object.values(bookingTrendMap).slice(-7);
    setBookingTrendData(trendSorted.length > 0 ? trendSorted : [
      { name: 'Mon', bookings: 2 },
      { name: 'Tue', bookings: 5 },
      { name: 'Wed', bookings: 3 },
      { name: 'Thu', bookings: 8 },
      { name: 'Fri', bookings: 4 }
    ]);

    // 6. Retirement check (Acquisition Date > 1.5 years ago)
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 18); // 18 months ago
    const dueRetirement = allAssets.filter(a => {
      const acqDate = new Date(a.acquisitionDate);
      return acqDate < cutoff && a.status !== 'RETIRED' && a.status !== 'DISPOSED';
    }).map(a => ({
      id: a.id,
      tag: a.assetTag,
      name: a.name,
      category: a.category?.name || 'Electronics',
      acquired: new Date(a.acquisitionDate).toLocaleDateString(),
      ageMonths: Math.round((new Date().getTime() - new Date(a.acquisitionDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4))
    }));
    setRetirementAssets(dueRetirement);
  };

  const loadDemoData = () => {
    setKpis({
      utilizationRate: 65,
      totalActiveAssets: 48,
      pendingMaintenance: 4,
      activeBookings: 8,
    });

    setUtilizationData([
      { name: 'Electronics', allocated: 15, available: 8, maintenance: 3 },
      { name: 'Furniture', allocated: 22, available: 12, maintenance: 1 },
      { name: 'Vehicles', allocated: 4, available: 2, maintenance: 1 },
    ]);

    setMaintenanceData([
      { name: 'Electronics', value: 12 },
      { name: 'Furniture', value: 3 },
      { name: 'Vehicles', value: 5 },
    ]);

    setDeptAllocationData([
      { name: 'IT Department', value: 18 },
      { name: 'HR Department', value: 8 },
      { name: 'Finance Department', value: 12 },
      { name: 'Marketing', value: 5 },
    ]);

    setBookingTrendData([
      { name: 'Jul 6', bookings: 3 },
      { name: 'Jul 7', bookings: 5 },
      { name: 'Jul 8', bookings: 2 },
      { name: 'Jul 9', bookings: 6 },
      { name: 'Jul 10', bookings: 8 },
      { name: 'Jul 11', bookings: 4 },
      { name: 'Jul 12', bookings: 7 },
    ]);

    setRetirementAssets([
      { id: '1', tag: 'AF-0012', name: 'MacBook Pro 2023', category: 'Electronics', acquired: '2023-05-10', ageMonths: 38 },
      { id: '2', tag: 'AF-0044', name: 'Dell XPS 15', category: 'Electronics', acquired: '2024-01-18', ageMonths: 30 },
      { id: '3', tag: 'AF-0102', name: 'Office Executive Chair', category: 'Furniture', acquired: '2022-09-05', ageMonths: 46 },
    ]);
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (assets.length === 0) return;
    
    const headers = ['Asset Tag', 'Asset Name', 'Category', 'Department', 'Status', 'Condition', 'Location', 'Acquisition Date', 'Cost'];
    const rows = assets.map(a => [
      a.assetTag,
      a.name,
      a.category?.name || 'N/A',
      a.department?.name || 'Unassigned',
      a.status,
      a.condition,
      a.location,
      new Date(a.acquisitionDate).toLocaleDateString(),
      a.acquisitionCost || '0'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AssetFlow_Asset_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 print:p-0">
      {/* Top action bar */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
            <BarChart3 className="text-[var(--color-primary)]" /> Reports & Analytics
          </h1>
          <p className="text-[var(--color-text-muted)]">Get high-level organizational insights and download data.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="gap-2" onClick={handlePrint}>
            <Printer size={16} /> Print Report
          </Button>
          <Button className="gap-2" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 bg-[var(--color-warning-bg)] border border-[var(--color-warning)] text-[var(--color-warning)] p-3 rounded-lg text-sm print:hidden">
          <AlertTriangle size={16} />
          {errorMsg}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Asset Utilization', value: `${kpis.utilizationRate}%`, subtitle: 'Allocated vs Active assets', Icon: TrendingUp, color: 'text-orange-500' },
          { title: 'Active Tracked Assets', value: kpis.totalActiveAssets, subtitle: 'Excluding lost/retired', Icon: BarChart3, color: 'text-emerald-500' },
          { title: 'Maintenance Backlog', value: kpis.pendingMaintenance, subtitle: 'Tickets open & in progress', Icon: Wrench, color: 'text-amber-500' },
          { title: 'Resource Bookings', value: kpis.activeBookings, subtitle: 'Active upcoming reservations', Icon: CalendarDays, color: 'text-purple-500' }
        ].map((kpi, idx) => (
          <Card key={idx}>
            <CardContent className="p-5 flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-muted)]">{kpi.title}</p>
                <h3 className="text-3xl font-extrabold text-[var(--color-text)] mt-1">{kpi.value}</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{kpi.subtitle}</p>
              </div>
              <kpi.Icon className={`${kpi.color} opacity-75`} size={24} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Utilization by Category */}
        <Card className="min-h-[350px]">
          <CardHeader>
            <h3 className="text-md font-bold text-[var(--color-text)] flex items-center gap-2">
              <BarChart3 size={18} className="text-[var(--color-primary)]" /> Asset Status by Category
            </h3>
          </CardHeader>
          <CardContent className="h-[280px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="allocated" fill="#f97316" name="Allocated" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="available" fill="#10b981" name="Available" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="maintenance" fill="#f59e0b" name="Maintenance" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Department-wise Allocation */}
        <Card className="min-h-[350px]">
          <CardHeader>
            <h3 className="text-md font-bold text-[var(--color-text)] flex items-center gap-2">
              <PieIcon size={18} className="text-[var(--color-primary)]" /> Department Allocations Summary
            </h3>
          </CardHeader>
          <CardContent className="h-[280px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">Loading chart...</div>
            ) : deptAllocationData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
                <CheckCircle size={32} className="mb-2 opacity-50" />
                No active allocations to show.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptAllocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {deptAllocationData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Frequency by Category */}
        <Card className="min-h-[350px]">
          <CardHeader>
            <h3 className="text-md font-bold text-[var(--color-text)] flex items-center gap-2">
              <Wrench size={18} className="text-[var(--color-primary)]" /> Maintenance Requests by Category
            </h3>
          </CardHeader>
          <CardContent className="h-[280px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">Loading chart...</div>
            ) : maintenanceData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
                <CheckCircle size={32} className="mb-2 opacity-50" />
                No maintenance history recorded.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintenanceData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#a855f7" name="Requests Raised" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Resource Booking Heatmap/Trend */}
        <Card className="min-h-[350px]">
          <CardHeader>
            <h3 className="text-md font-bold text-[var(--color-text)] flex items-center gap-2">
              <CalendarDays size={18} className="text-[var(--color-primary)]" /> Resource Booking Frequency
            </h3>
          </CardHeader>
          <CardContent className="h-[280px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bookingTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="bookings" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} activeDot={{ r: 8 }} name="Bookings Made" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Due for retirement table */}
      <Card>
        <CardHeader>
          <h3 className="text-md font-bold text-[var(--color-text)] flex items-center gap-2">
            <AlertTriangle className="text-amber-500 animate-pulse" size={18} /> Assets Nearing Retirement / Cycle Check-up
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">Tracked assets older than 18 months that may need maintenance review or decommission.</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-background)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Tag</th>
                  <th className="p-4 font-medium">Asset Name</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Acquired Date</th>
                  <th className="p-4 font-medium">Age (Months)</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center">Loading...</td></tr>
                ) : retirementAssets.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-[var(--color-text-muted)]">No aging assets detected. Excellent fleet health!</td></tr>
                ) : (
                  retirementAssets.map(asset => (
                    <tr key={asset.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)]">
                      <td className="p-4 font-medium text-[var(--color-primary)]">{asset.tag}</td>
                      <td className="p-4 text-[var(--color-text)]">{asset.name}</td>
                      <td className="p-4 text-[var(--color-text-muted)]">{asset.category}</td>
                      <td className="p-4 text-[var(--color-text-muted)]">{asset.acquired}</td>
                      <td className="p-4 font-semibold text-amber-500">{asset.ageMonths} mo</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 text-xs rounded-full bg-[var(--color-warning-bg)] text-[var(--color-warning)] font-bold">
                          REPLACE SOON
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
