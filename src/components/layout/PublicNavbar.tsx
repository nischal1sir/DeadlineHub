import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, LogIn, LayoutDashboard } from 'lucide-react';
import logoImage from '../../assets/logo.png';

export const PublicNavbar: React.FC = () => {
  const navigate = useNavigate();

  const handleBrandClick = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDashboardClick = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignInClick = () => {
    navigate('/login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateAccountClick = () => {
    navigate('/register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-2 overflow-x-hidden">
        {/* Left: DeadlineHub Brand Logo & Text - Lands on Public Dash ("/") on Click */}
        <button
          onClick={handleBrandClick}
          className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-brand/40 rounded-xl p-1 transition-all shrink-0 min-w-0"
          aria-label="DeadlineHub Home"
          title="Go to Public Dashboard"
        >
          <img
            src={logoImage}
            alt="DeadlineHub Logo"
            className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl object-contain shrink-0 group-hover:scale-105 transition-transform"
          />
          <span className="font-heading font-bold text-sm sm:text-xl tracking-tight text-slate-900 group-hover:text-brand transition-colors whitespace-nowrap truncate">
            Deadline<span className="text-brand">Hub</span>
          </span>
        </button>

        {/* Right: Auth & Navigation Actions */}
        <nav className="flex items-center gap-1 sm:gap-3 shrink-0">
          <button
            onClick={handleDashboardClick}
            className="hidden md:flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
            title="Public Dashboard"
          >
            <LayoutDashboard size={16} className="text-brand" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={handleSignInClick}
            className="flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 px-1.5 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            <LogIn size={14} className="shrink-0" />
            <span className="hidden xs:inline sm:inline">Sign In</span>
          </button>

          <button
            onClick={handleCreateAccountClick}
            className="text-xs sm:text-sm font-semibold text-white bg-brand hover:bg-brand-hover px-2 sm:px-4 py-1.5 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0"
          >
            <UserPlus size={14} className="shrink-0" />
            <span className="hidden sm:inline">Create Account</span>
            <span className="sm:hidden">Sign Up</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export const Header = PublicNavbar;