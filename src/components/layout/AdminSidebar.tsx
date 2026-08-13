import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCog, BarChart3,
  Settings, ShieldAlert, History, User
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import logoImg from "../../assets/logo.png";

interface AdminSidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'super_admin';

  const navItems: { to: string; end: boolean; icon: any; label: string }[] = [
    { to: '/admin', end: true, icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', end: false, icon: Users, label: 'User Management' },
  ];

  if (isSuperAdmin) {
    navItems.push({ to: '/admin/admins', end: false, icon: UserCog, label: 'Admin Management' });
  }

  navItems.push(
    { to: '/admin/statistics', end: false, icon: BarChart3, label: 'Platform Statistics' },
  );

  // Activity Logs page only available to Super Admin
  if (isSuperAdmin) {
    navItems.push({ to: '/admin/activity-logs', end: false, icon: History, label: 'Activity Logs' });
  }

  navItems.push(
    { to: '/admin/profile', end: false, icon: User, label: 'My Profile' },
    { to: '/admin/settings', end: false, icon: Settings, label: 'System Settings' }
  );
  // NOTE: Notifications are accessed via floating panel in the navbar, not sidebar

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'A';

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
          'fixed top-0 left-0 z-40 h-full w-64 flex flex-col',
          'border-r border-slate-200 bg-white text-slate-700',
          'transition-transform duration-250 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:h-screen',
        ].join(' ')}
      >
        {/* Header Branding */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-light border border-brand/20 flex items-center justify-center text-brand">
              <img src={logoImg} alt="Logo" className="w-8 h-8" />
            </div>
            <div>
              <span className="font-heading font-bold text-base text-slate-900 tracking-wide block leading-tight">
                Deadline<span className="text-brand">Hub</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-brand block">
                {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN PORTAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Platform Administration
            </p>
            <nav className="space-y-1">
              {navItems.map(({ to, end, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onCloseMobile}
                  className={({ isActive }) => [
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-brand text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                  ].join(' ')}
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500'} />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* User Footer Card — Clickable to Admin Profile */}
        {user && (
          <div className="px-3 py-4 border-t border-slate-200 shrink-0 bg-slate-50/60">
            <NavLink
              to="/admin/profile"
              onClick={onCloseMobile}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl border transition shadow-xs cursor-pointer ${
                isActive
                  ? 'bg-brand-light border-brand/40 text-slate-900'
                  : 'bg-white border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 truncate">{user.full_name}</span>
                <span className="text-[10px] text-brand font-semibold truncate uppercase flex items-center gap-1">
                  {isSuperAdmin ? <ShieldAlert size={10} /> : <img src={logoImg} alt="Logo" className="w-4 h-4" />}
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </NavLink>
          </div>
        )}
      </aside>
    </>
  );
};
