import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './context/ToastContext';
import { usePageTitle } from './hooks/usePageTitle';

// User Portal Pages
import { UserDashboard } from './pages/UserDashboard';
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
import { AdminProfilePage } from './pages/admin/AdminProfilePage';
import { UserActivityPage } from './pages/admin/UserActivityPage';

// Public Auth Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { AuthCallback } from './pages/AuthCallback';
import { PublicDashboard } from './components/layout/PublicDash';


// Layouts
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AdminLayout } from './components/layout/AdminLayout';
import { GlobalLoader } from './components/ui/GlobalLoader';

/* ── Auth Guard ──*/
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <GlobalLoader text="Loading..." />;
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
    return <Navigate to="/dashboard" replace />;
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

/* ── OAuth Hash Catch Fallback (handles implicit flow hash fragments globally) ── */
const RootOAuthCatch: React.FC = () => {
  React.useEffect(() => {
    if (window.location.hash.includes('access_token=') || window.location.hash.includes('error=')) {
      const target = `/auth/callback${window.location.search}${window.location.hash}`;
      window.location.href = target;
    }
  }, []);

  return <PublicDashboard />;
};

/* ── Page Title Component (must be inside BrowserRouter) ── */
const PageTitle: React.FC = () => {
  usePageTitle();
  return null;
};

/* ── Root Application Router */
export default function App() {
  /* ── Global hash fragment handler for any route (implicit flow fallback) ── */
  React.useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.includes('access_token=') || window.location.hash.includes('error=')) {
        const target = `/auth/callback${window.location.search}${window.location.hash}`;
        window.location.href = target;
      }
    };

    // Check on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <PageTitle />
          <Routes>
          {/* Public Landing + Auth Routes */}
          <Route path="/" element={<RootOAuthCatch />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

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
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Profile />} />
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
            <Route path="users/:userId/activity" element={<RequireSuperAdminGuard><UserActivityPage /></RequireSuperAdminGuard>} />
            <Route path="admins" element={<RequireSuperAdminGuard><AdminManagementPage /></RequireSuperAdminGuard>} />
            <Route path="statistics" element={<PlatformStatisticsPage />} />
            <Route path="activity-logs" element={<RequireSuperAdminGuard><ActivityLogsPage /></RequireSuperAdminGuard>} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="settings" element={<SystemSettingsPage />} />
          </Route>

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
    </AuthProvider>
  );
}
