import React, { useState } from 'react';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Package, Users, CalendarDays, 
  Wrench, ClipboardCheck, BarChart3, LogOut, Settings,
  ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen,
  Activity
} from 'lucide-react';

function WorkspaceSwitcher({ currentWorkspace, userName }: { currentWorkspace: string, userName: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-2 py-2 mb-4 rounded-lg hover:bg-white/5 cursor-pointer transition-colors select-none group border border-transparent hover:border-zinc-800"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[6px] bg-orange-500 text-white flex items-center justify-center font-semibold text-[13px] shadow-sm uppercase">
            {currentWorkspace.charAt(0)}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[13px] font-medium leading-none mb-1 text-white truncate max-w-[120px]">{currentWorkspace}</span>
            <span className="text-[11px] text-zinc-400 leading-none truncate max-w-[120px]">{userName}</span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" strokeWidth={1.5} />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[52px] left-0 w-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 py-2.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3.5 py-1 text-[13px] font-medium text-orange-500">
              {currentWorkspace}
            </div>
            <div className="h-px bg-zinc-800 my-2 mx-3" />
            <div className="px-3.5 py-1 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
              User Profile
            </div>
            <div className="px-3.5 py-1.5 text-[13px] text-zinc-300">
              Role: <span className="text-white font-medium text-xs bg-zinc-800 px-2 py-0.5 rounded-full">{userName}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NavItem({ 
  item, 
  activePath,
  level = 0,
  onClick
}: { 
  item: any; 
  activePath: string;
  level?: number;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const isActive = activePath === item.path || (item.path !== '/' && activePath.startsWith(item.path));
  const hasChildren = !!item.children;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col w-full">
      {hasChildren ? (
        <div 
          className="group flex items-center justify-between px-2.5 py-[7px] rounded-[6px] cursor-pointer transition-all duration-200 select-none text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
          style={{ paddingLeft: `${level * 12 + 10}px` }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2.5">
            <item.icon className="w-[16px] h-[16px] text-zinc-500 group-hover:text-zinc-300" strokeWidth={1.5} />
            <span className="text-[13px] tracking-wide truncate">{item.title}</span>
          </div>
          <ChevronRight 
            className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
            strokeWidth={2}
          />
        </div>
      ) : (
        <Link 
          to={item.path}
          onClick={onClick}
          className={`group flex items-center justify-between px-2.5 py-[7px] rounded-[6px] cursor-pointer transition-all duration-200 select-none no-underline
            ${isActive 
              ? 'bg-zinc-800 text-white font-medium shadow-sm' 
              : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
            }
          `}
          style={{ paddingLeft: `${level * 12 + 10}px` }}
        >
          <div className="flex items-center gap-2.5">
            <item.icon 
              className={`w-[16px] h-[16px] transition-colors
                ${isActive ? 'text-orange-500' : 'text-zinc-500 group-hover:text-zinc-300'}
              `} 
              strokeWidth={1.5} 
            />
            <span className="text-[13px] tracking-wide truncate">
              {item.title}
            </span>
          </div>
          {item.badge && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-medium rounded-full bg-orange-500/10 text-orange-500">
              {item.badge}
            </span>
          )}
        </Link>
      )}

      {hasChildren && (
        <div 
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden min-h-0 relative flex flex-col gap-0.5 mt-0.5">
            <div 
              className="absolute top-0 bottom-0 border-l border-white/5"
              style={{ left: `${level * 12 + 17.5}px` }}
            />
            {item.children.map((child: any) => (
              <NavItem 
                key={child.id} 
                item={child} 
                activePath={activePath} 
                level={level + 1} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const Layout: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen font-sans text-zinc-500 bg-zinc-950">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Sidebar Groups adapted from actual routes & permissions
  const groups = [
    {
      items: [
        { id: 'dashboard', title: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['EMPLOYEE','DEPARTMENT_HEAD','ASSET_MANAGER','ADMIN'] },
        { id: 'setup', title: 'Organization setup', path: '/setup', icon: Settings, roles: ['ADMIN'] },
      ]
    },
    {
      heading: 'Operations',
      items: [
        { id: 'assets', title: 'Assets', path: '/assets', icon: Package, roles: ['EMPLOYEE','DEPARTMENT_HEAD','ASSET_MANAGER','ADMIN'] },
        { id: 'allocations', title: 'Allocations', path: '/allocations', icon: Users, roles: ['EMPLOYEE','DEPARTMENT_HEAD','ASSET_MANAGER','ADMIN'] },
        { id: 'bookings', title: 'Bookings', path: '/bookings', icon: CalendarDays, roles: ['EMPLOYEE','DEPARTMENT_HEAD','ASSET_MANAGER','ADMIN'] },
        { id: 'maintenance', title: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['EMPLOYEE','DEPARTMENT_HEAD','ASSET_MANAGER','ADMIN'] },
      ]
    },
    {
      heading: 'Management',
      items: [
        { id: 'audits', title: 'Audits', path: '/audits', icon: ClipboardCheck, roles: ['ASSET_MANAGER','ADMIN'] },
        { id: 'reports', title: 'Reports', path: '/reports', icon: BarChart3, roles: ['DEPARTMENT_HEAD','ASSET_MANAGER','ADMIN'] },
        { id: 'logs', title: 'Activity Logs', path: '/logs', icon: Activity, roles: ['EMPLOYEE','DEPARTMENT_HEAD','ASSET_MANAGER','ADMIN'] },
      ]
    }
  ];

  // Filter allowed groups & items
  const allowedGroups = groups.map(group => ({
    ...group,
    items: group.items.filter(item => user && item.roles.includes(user.role))
  })).filter(group => group.items.length > 0);

  const flatItems = allowedGroups.flatMap(g => g.items);
  const currentPage = flatItems.find(item =>
    item.path === location.pathname || (item.path !== '/' && location.pathname.startsWith(item.path))
  )?.title ?? 'Dashboard';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 font-sans">
      
      {/* ── Sidebar Nav ── */}
      <div 
        className={`h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-zinc-900 border-r border-zinc-800/80 flex flex-col p-3 ${
          open ? 'w-[260px] opacity-100' : 'w-0 opacity-0 border-r-0 !p-0'
        }`}
      >
        <WorkspaceSwitcher currentWorkspace="AssetFlow" userName={user?.role ?? 'User'} />

        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-4 mt-2">
          {allowedGroups.map((group, idx) => (
            <div key={idx} className="flex flex-col gap-0.5">
              {group.heading && (
                <span className="px-2.5 mb-1 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                  {group.heading}
                </span>
              )}
              {group.items.map(item => (
                <NavItem 
                  key={item.id} 
                  item={item} 
                  activePath={location.pathname} 
                />
              ))}
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-zinc-800 flex flex-col gap-0.5">
          <div onClick={() => logout()} className="w-full">
            <NavItem 
              item={{ id: 'logout', title: 'Log out', path: '#', icon: LogOut }} 
              activePath="" 
              onClick={(e) => { e.preventDefault(); logout(); }}
            />
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex flex-1 flex-col overflow-hidden m-2 md:m-2.5">
        
        {/* Header with Breadcrumbs & Sidebar Toggle */}
        <div className="bg-zinc-900 rounded-t-2xl px-6 height-14 h-14 flex items-center gap-4 border-b border-zinc-800/80 shrink-0">
          <button 
            onClick={() => setOpen(!open)}
            className="p-1.5 rounded-md text-zinc-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            {open ? <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />}
          </button>
          
          <div className="flex items-center gap-2 text-sm text-zinc-400 select-none">
            <span className="truncate">AssetFlow</span>
            <span className="text-zinc-600">/</span>
            <span className="font-medium text-white truncate">{currentPage}</span>
          </div>
        </div>

        {/* Dynamic Page content */}
        <div className="bg-zinc-900 rounded-b-2xl flex-1 overflow-auto p-6 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
