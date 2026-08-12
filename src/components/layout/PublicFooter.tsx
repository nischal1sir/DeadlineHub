import React from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaInstagram } from 'react-icons/fa';

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/80 bg-white/60 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-10 grid gap-8 sm:grid-cols-3">
        {/* Project description */}
        <div className="space-y-2">
          <h3 className="font-heading font-bold text-sm text-slate-900">DeadlineHub</h3>
          <p className="text-sm text-slate-500 max-w-xs">
            Track project deadlines, manage tasks, and keep every module on
            schedule — all in one workspace.
          </p>
        </div>

        {/* Developer credit */}
        <div className="space-y-2 sm:text-center">
          <h3 className="font-heading font-bold text-sm text-slate-900">Developer</h3>
          <p className="text-sm text-slate-500">
            Developed by{' '}
            <span className="font-medium text-slate-700">Nischal Rai</span>
          </p>
        </div>

        {/* Developer / social links */}
        <div className="space-y-2 sm:text-right">
          <h3 className="font-heading font-bold text-sm text-slate-900">Connect</h3>
          <div className="flex gap-3 sm:justify-end">
            {/* GitHub profile URL */}
            <Link
              to="https://github.com/nischal1sir"
              aria-label="GitHub"
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-brand/10 hover:text-brand transition-colors"
            >
              <FaGithub size={16} />
            </Link>
            {/* Instagram profile URL */}
            <Link
              to="https://www.instagram.com/niggafuckingsucks/"
              aria-label="Instagram"
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-brand/10 hover:text-brand transition-colors"
            >
              <FaInstagram size={16} />
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/80">
        <p className="max-w-7xl mx-auto px-6 py-4 text-xs text-slate-400">
          © {year} DeadlineHub. All rights reserved.
        </p>
      </div>
    </footer>
  );
};