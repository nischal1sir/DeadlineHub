import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const routeTitles: Record<string, string> = {
  '/': 'DeadlineHub',
  '/login': 'Sign In - DeadlineHub',
  '/register': 'Sign Up - DeadlineHub',
  '/forgot-password': 'Forgot Password - DeadlineHub',
  '/reset-password': 'Reset Password - DeadlineHub',
  '/auth/callback': 'Authenticating - DeadlineHub',
  '/dashboard': 'Dashboard - DeadlineHub',
  '/projects': 'Projects - DeadlineHub',
  '/calendar': 'Calendar - DeadlineHub',
  '/timeline': 'Timeline - DeadlineHub',
  '/analytics': 'Analytics - DeadlineHub',
  '/profile': 'Profile - DeadlineHub',
  '/settings': 'Settings - DeadlineHub',
  '/pending-tasks': 'Pending Tasks - DeadlineHub',
  '/admin': 'Admin Dashboard - DeadlineHub',
  '/admin/users': 'User Management - DeadlineHub',
  '/admin/admins': 'Admin Management - DeadlineHub',
  '/admin/statistics': 'Platform Statistics - DeadlineHub',
  '/admin/activity-logs': 'Activity Logs - DeadlineHub',
  '/admin/profile': 'Admin Profile - DeadlineHub',
  '/admin/settings': 'System Settings - DeadlineHub',
  '/admin/users/activity': 'User Activity - DeadlineHub',
};

const dynamicRoutes: Array<{ pattern: (path: string) => boolean; title: string }> = [
  { pattern: (path) => path.startsWith('/projects/') && path !== '/projects', title: 'Project Details - DeadlineHub' },
  { pattern: (path) => path.startsWith('/admin/users/') && path !== '/admin/users', title: 'User Activity - DeadlineHub' },
];

export function usePageTitle() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    // Handle dynamic routes first
    for (const route of dynamicRoutes) {
      if (route.pattern(path)) {
        document.title = route.title;
        return;
      }
    }

    // Handle exact matches
    const title = routeTitles[path] || 'DeadlineHub';
    document.title = title;
  }, [location.pathname]);
}

export function getPageTitle(pathname: string): string {
  for (const route of dynamicRoutes) {
    if (route.pattern(pathname)) {
      return route.title;
    }
  }
  return routeTitles[pathname] || 'DeadlineHub';
}