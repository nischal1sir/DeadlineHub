import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminNavbar } from './AdminNavbar';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-white text-slate-800">
      <AdminSidebar
        isMobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-surface">
        <AdminNavbar onToggleSidebar={() => setSidebarOpen(s => !s)} />

        <main className="flex-1 overflow-y-auto bg-white p-4 md:p-6 text-slate-800">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
