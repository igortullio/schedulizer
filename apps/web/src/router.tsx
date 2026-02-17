import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/auth-layout'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PublicLayout } from '@/components/layout/public-layout'
import { RoleGuard } from '@/components/layout/role-guard'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, lazy: () => import('@/routes/dashboard/index') },
      { path: 'services', lazy: () => import('@/routes/dashboard/services') },
      { path: 'appointments', lazy: () => import('@/routes/dashboard/appointments') },
      { path: 'time-blocks', lazy: () => import('@/routes/dashboard/time-blocks') },
      {
        element: <RoleGuard allowedRoles={['owner', 'admin']} />,
        children: [{ path: 'members', lazy: () => import('@/routes/dashboard/members') }],
      },
      {
        element: <RoleGuard allowedRoles={['owner']} />,
        children: [
          { path: 'settings', lazy: () => import('@/routes/dashboard/settings') },
          { path: 'subscription', element: <Navigate to="/dashboard/settings" replace /> },
        ],
      },
    ],
  },
  {
    path: '/pricing',
    lazy: () => import('@/routes/pricing'),
  },
  {
    path: '/services',
    element: <Navigate to="/dashboard/services" replace />,
  },
  {
    path: '/services/*',
    element: <Navigate to="/dashboard/services" replace />,
  },
  {
    path: '/appointments',
    element: <Navigate to="/dashboard/appointments" replace />,
  },
  {
    path: '/time-blocks',
    element: <Navigate to="/dashboard/time-blocks" replace />,
  },
  {
    path: '/settings',
    element: <Navigate to="/dashboard/settings" replace />,
  },
  {
    path: '/subscription',
    element: <Navigate to="/dashboard/settings" replace />,
  },
  {
    path: '/checkout/success',
    lazy: () => import('@/routes/checkout/success'),
  },
  {
    path: '/checkout/cancel',
    lazy: () => import('@/routes/checkout/cancel'),
  },
  {
    path: '/invite/:id',
    element: <AuthLayout />,
    children: [{ index: true, lazy: () => import('@/routes/invite/index') }],
  },
  {
    path: '/booking',
    element: <PublicLayout />,
    children: [
      {
        path: ':slug',
        lazy: () => import('@/routes/booking/index'),
      },
      {
        path: ':slug/manage/:token',
        lazy: () => import('@/routes/booking/manage'),
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        lazy: () => import('@/routes/auth/login'),
      },
      {
        path: 'verify',
        lazy: () => import('@/routes/auth/verify'),
      },
      {
        path: 'org-select',
        lazy: () => import('@/routes/auth/org-select'),
      },
    ],
  },
])
