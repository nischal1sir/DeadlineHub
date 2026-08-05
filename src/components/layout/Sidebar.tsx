import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { to: '/', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', end: false, icon: FolderKanban, label: 'Projects' },
  { to: '/profile', end: false, icon: User, label: 'Profile' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { user } = useAuth();

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed top-0 left-0 z-40 h-full w-60 flex flex-col',
          'border-r border-slate-200 bg-surface',
          'transition-transform duration-250 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:h-screen',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-slate-200 shrink-0">
          <CheckCircle2 size={20} className="text-brand" />
          <span className="font-heading font-bold text-lg text-slate-900">
            Tracker<span className="text-brand">.</span>
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onCloseMobile}
              className={({ isActive }) => [
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-brand-light',
              ].join(' ')}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer user card */}
        {user && (
          <div className="px-3 py-3 border-t border-slate-200 shrink-0">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user.avatar_url
                  ? <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                  : initials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-800 truncate">{user.full_name}</span>
                <span className="text-[10px] text-slate-500 truncate">{user.email}</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
