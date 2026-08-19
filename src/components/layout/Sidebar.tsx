import React from 'react';
import { NavLink } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import {
  LayoutDashboard, FolderKanban, Calendar,
  GanttChartSquare, BarChart2, Settings
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const userNavItems = [
    { to: '/dashboard', end: true, icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', end: false, icon: FolderKanban, label: 'Projects' },
    { to: '/calendar', end: false, icon: Calendar, label: 'Calendar' },
    { to: '/timeline', end: false, icon: GanttChartSquare, label: 'Timeline / Gantt' },
    { to: '/analytics', end: false, icon: BarChart2, label: 'Analytics' },
  ];

  const bottomNavItems = [
    { to: '/settings', end: false, icon: Settings, label: 'Settings' },
  ];

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
          <img src={logoImg} alt="Logo" className="w-12 h-12" />
          <span className="font-heading font-bold text-lg text-slate-900">
            Deadline<span className="text-brand">Hub</span>
          </span>
        </div>

        {/* User Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {userNavItems.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onCloseMobile}
              className={({ isActive }) => [
                'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-brand-light',
              ].join(' ')}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Nav links (Settings) */}
        <nav className="px-3 pb-3 space-y-1 border-t border-slate-200">
          {bottomNavItems.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onCloseMobile}
              className={({ isActive }) => [
                'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-brand-light',
              ].join(' ')}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        
      </aside>
    </>
  );
};
