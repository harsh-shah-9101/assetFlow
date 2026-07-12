import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  CalendarDays, 
  Wrench, 
  ClipboardCheck, 
  BarChart3,
  LogOut
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN'] },
    { name: 'Assets', path: '/assets', icon: Package, roles: ['EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN'] },
    { name: 'Allocations', path: '/allocations', icon: Users, roles: ['EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN'] },
    { name: 'Bookings', path: '/bookings', icon: CalendarDays, roles: ['EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN'] },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN'] },
    { name: 'Audits', path: '/audits', icon: ClipboardCheck, roles: ['ASSET_MANAGER', 'ADMIN'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN'] },
    { name: 'Org Setup', path: '/setup', icon: Users, roles: ['ADMIN'] },
  ];

  const allowedNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-[var(--color-background)]">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-[var(--color-border)] flex flex-col">
        <div className="p-6 border-b border-[var(--color-border)]">
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">AssetFlow</h1>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="flex flex-col gap-2">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium' 
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-background)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    <Icon size={20} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center font-bold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-sm">{user?.name}</div>
              <div className="text-xs text-[var(--color-text-muted)]">{user?.role}</div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 w-full text-left text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] rounded-md transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-[var(--color-border)] flex items-center px-8 shadow-sm z-10">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            {allowedNavItems.find(item => item.path === location.pathname)?.name || 'AssetFlow'}
          </h2>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
