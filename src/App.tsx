import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

// User Portal Pages
import { Dashboard } from './pages/Dashboard';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetails } from './pages/ProjectDetails';
import { CalendarPage } from './pages/user/CalendarPage';
import { TimelinePage } from './pages/user/TimelinePage';
import { AnalyticsPage } from './pages/user/AnalyticsPage';
import { Profile } from './pages/Profile';
import { PendingTasksPage } from './pages/PendingTasksPage';

// Admin Portal Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { AdminManagementPage } from './pages/admin/AdminManagementPage';
import { PlatformStatisticsPage } from './pages/admin/PlatformStatisticsPage';
import { ActivityLogsPage } from './pages/admin/ActivityLogsPage';
import { SystemSettingsPage } from './pages/admin/SystemSettingsPage';

// Public Auth Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';


// Layouts
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AdminLayout } from './components/layout/AdminLayout';

/* ── Auth Guard ──*/
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <svg className="animate-spin h-10 w-10 text-brand" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

/* ── User Guard (Blocks Admins from User Portal) ───────── */
const RequireUserGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'admin' || user?.role === 'super_admin') {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
};

/* ── Admin Guard (Blocks Standard Users from Admin Portal) ── */
const RequireAdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'user') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

/* ── Super Admin Guard */
const RequireSuperAdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'super_admin') {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
};

/* ── User Portal Shell  */
const UserLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar
        isMobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(s => !s)} />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

/* ── Root Application Router */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          {/* <Route path="/reset-password" element={<ResetPassword />} /> */}

          {/* User Portal Protected Routes */}
          <Route
            element={
              <RequireAuth>
                <RequireUserGuard>
                  <UserLayout />
                </RequireUserGuard>
              </RequireAuth>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/pending-tasks" element={<PendingTasksPage />} />
          </Route>

          {/* Admin Portal Protected Routes */}
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <RequireAdminGuard>
                  <AdminLayout />
                </RequireAdminGuard>
              </RequireAuth>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="admins" element={<RequireSuperAdminGuard><AdminManagementPage /></RequireSuperAdminGuard>} />
            <Route path="statistics" element={<PlatformStatisticsPage />} />
            <Route path="activity-logs" element={<ActivityLogsPage />} />
            <Route path="settings" element={<SystemSettingsPage />} />
          </Route>

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
