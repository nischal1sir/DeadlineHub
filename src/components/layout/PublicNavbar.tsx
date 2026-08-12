import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import logoImage from '../../assets/logo.png';

export const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 group"
          aria-label="DeadlineHub home"
        >
          <img
            src={logoImage}
            alt="DeadlineHub"
            className="w-8 h-8 rounded-lg object-cover shrink-0 group-hover:opacity-90 transition-opacity"
          />
          <span className="font-heading font-bold text-lg text-slate-900 tracking-tight">
            DeadlineHub
          </span>
        </button>

        {/* Right: auth actions */}
        <nav className="flex items-center gap-2">
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 px-2 sm:px-3 py-1.5 rounded-lg transition-colors"
          >
            Login
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="text-sm font-semibold text-white bg-brand hover:bg-brand/90 px-3 sm:px-4 py-1.5 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5"
            aria-label="Sign Up"
          >
            <UserPlus size={16} className="sm:hidden" />
            <span className="hidden sm:inline">Sign Up</span>
          </button>
        </nav>
      </div>
    </header>
  );
};