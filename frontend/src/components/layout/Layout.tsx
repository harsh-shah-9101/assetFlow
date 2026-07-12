import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
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
import { Sidebar, SidebarBody, SidebarLink } from '../ui/sidebar';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export const Layout: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

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
    <div className="flex h-screen bg-gray-100 dark:bg-neutral-800 w-full overflow-hidden">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-x-hidden overflow-y-auto">
            <a
              href="#"
              className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white"
            >
              <div className="h-6 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
              <motion.span
                animate={{ opacity: open ? 1 : 0, display: open ? "inline-block" : "none" }}
                className="font-semibold whitespace-pre text-black dark:text-white text-xl"
              >
                AssetFlow
              </motion.span>
            </a>
            <div className="mt-8 flex flex-col gap-2">
              {allowedNavItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <SidebarLink 
                    key={item.path} 
                    className={cn(isActive && "bg-neutral-200 dark:bg-neutral-700 rounded-md")}
                    link={{ 
                      label: item.name, 
                      href: item.path, 
                      icon: <item.icon className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" /> 
                    }} 
                  />
                );
              })}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: user?.name || "User",
                href: "#",
                icon: (
                  <div className="h-7 w-7 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center font-bold shrink-0">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                ),
              }}
            />
            <button onClick={logout} className="w-full text-left mt-2">
               <SidebarLink
                  link={{
                    label: "Logout",
                    href: "#",
                    icon: <LogOut className="h-5 w-5 shrink-0 text-red-500" />
                  }}
                  onClick={(e) => { e.preventDefault(); logout(); }}
               />
            </button>
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1 flex-col overflow-hidden bg-gray-100 dark:bg-neutral-800">
        <header className="h-16 flex items-center px-8 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 rounded-tl-2xl rounded-tr-2xl md:mx-2 mt-2">
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
            {allowedNavItems.find(item => item.path === location.pathname)?.name || 'AssetFlow'}
          </h2>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in bg-white dark:bg-neutral-900 md:mx-2 md:mb-2 rounded-bl-2xl rounded-br-2xl border-x border-b border-neutral-200 dark:border-neutral-700">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
