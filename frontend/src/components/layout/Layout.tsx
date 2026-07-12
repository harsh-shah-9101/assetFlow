import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  LayoutDashboard, Package, Users, CalendarDays, 
  Wrench, ClipboardCheck, BarChart3, LogOut
} from 'lucide-react';
import { Sidebar, SidebarBody, SidebarLink } from '../ui/sidebar';
import { useSidebar } from '../../context/SidebarContext';

/* Logo shown inside sidebar, consumes context directly */
const SidebarLogo = () => {
  const { open } = useSidebar();
  return (
    <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 8px', textDecoration: 'none', marginBottom: '8px', overflow: 'hidden' }}>
      <div style={{ width: 24, height: 20, flexShrink: 0, borderRadius: '5px 3px 5px 2px', backgroundColor: 'var(--color-primary)' }} />
      <AnimatePresence initial={false}>
        {open && (
          <motion.span
            key="logo-text"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.18 }}
            style={{ fontWeight: 700, fontSize: '17px', color: 'var(--color-text)', whiteSpace: 'nowrap' }}
          >
            AssetFlow
          </motion.span>
        )}
      </AnimatePresence>
    </a>
  );
};

export const Layout: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: '#6b7280' }}>
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const navItems = [
    { name: 'Dashboard',   path: '/',           icon: LayoutDashboard, roles: ['EMPLOYEE','DEPARTMENT_HEAD','ASSET_MANAGER','ADMIN'] },
    { name: 'Assets',      path: '/assets',      icon: Package,         roles: ['EMPLOYEE','DEPARTMENT_HEAD','ASSET_MANAGER','ADMIN'] },
    { name: 'Allocations', path: '/allocations', icon: Users,           roles: ['EMPLOYEE','DEPARTMENT_HEAD','ASSET_MANAGER','ADMIN'] },
    { name: 'Bookings',    path: '/bookings',    icon: CalendarDays,    roles: ['EMPLOYEE','DEPARTMENT_HEAD','ASSET_MANAGER','ADMIN'] },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench,          roles: ['EMPLOYEE','DEPARTMENT_HEAD','ASSET_MANAGER','ADMIN'] },
    { name: 'Audits',      path: '/audits',      icon: ClipboardCheck,  roles: ['ASSET_MANAGER','ADMIN'] },
    { name: 'Reports',     path: '/reports',     icon: BarChart3,       roles: ['DEPARTMENT_HEAD','ASSET_MANAGER','ADMIN'] },
    { name: 'Org Setup',   path: '/setup',       icon: Users,           roles: ['ADMIN'] },
  ];

  const allowed = navItems.filter(item => user && item.roles.includes(user.role));

  const currentPage = allowed.find(item =>
    item.path === location.pathname || (item.path !== '/' && location.pathname.startsWith(item.path))
  )?.name ?? 'Dashboard';

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100%',
      overflow: 'hidden',
      backgroundColor: 'var(--color-background)',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* ── Sidebar ── */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody>
          {/* Logo */}
          <SidebarLogo />

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: 'var(--color-border)', margin: '8px 0 16px' }} />

          {/* Nav links – scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {allowed.map(item => {
              const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <SidebarLink
                  key={item.path}
                  isActive={active}
                  link={{
                    label: item.name,
                    href: item.path,
                    icon: <item.icon size={20} color={active ? 'var(--color-primary)' : 'var(--color-text-muted)'} strokeWidth={active ? 2 : 1.5} />,
                  }}
                />
              );
            })}
          </div>

          {/* Bottom: user + logout */}
          <div style={{ paddingTop: '12px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <SidebarLink
              link={{
                label: user?.name ?? 'User',
                href: '#',
                icon: (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff', background: 'linear-gradient(135deg,#667eea,#764ba2)', flexShrink: 0 }}>
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                ),
              }}
            />
            <div onClick={() => logout()} style={{ cursor: 'pointer' }}>
              <SidebarLink
                link={{
                  label: 'Logout',
                  href: '#',
                  icon: <LogOut size={20} color="#ef4444" strokeWidth={1.5} />,
                }}
                onClick={(e: React.MouseEvent) => { e.preventDefault(); logout(); }}
              />
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* ── Main area ── */}
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden', margin: '8px 8px 8px 0' }}>
        {/* Header */}
        <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '16px 16px 0 0', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{currentPage}</h2>
        </div>

        {/* Page content */}
        <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '0 0 16px 16px', flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};
