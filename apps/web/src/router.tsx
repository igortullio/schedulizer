import { SentryErrorBoundary } from '@schedulizer/observability/browser'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/auth-layout'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PublicLayout } from '@/components/layout/public-layout'
import { RoleGuard } from '@/components/layout/role-guard'

const routeErrorFallback = (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h1>Something went wrong</h1>
    <p>An error occurred while loading this page. Please try again.</p>
    <button type="button" onClick={() => window.location.reload()}>
      Reload
    </button>
  </div>
)

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
    lazy: async () => {
      const module = await import('@/routes/checkout/success')
      return {
        ...module,
        Component: () => (
          <SentryErrorBoundary fallback={routeErrorFallback} context="checkout-success">
            <module.Component />
          </SentryErrorBoundary>
        ),
      }
    },
  },
  {
    path: '/checkout/cancel',
    lazy: async () => {
      const module = await import('@/routes/checkout/cancel')
      return {
        ...module,
        Component: () => (
          <SentryErrorBoundary fallback={routeErrorFallback} context="checkout-cancel">
            <module.Component />
          </SentryErrorBoundary>
        ),
      }
    },
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
        lazy: async () => {
          const module = await import('@/routes/booking/index')
          return {
            ...module,
            Component: () => (
              <SentryErrorBoundary fallback={routeErrorFallback} context="booking-page">
                <module.Component />
              </SentryErrorBoundary>
            ),
          }
        },
      },
      {
        path: ':slug/manage/:token',
        lazy: async () => {
          const module = await import('@/routes/booking/manage')
          return {
            ...module,
            Component: () => (
              <SentryErrorBoundary fallback={routeErrorFallback} context="booking-manage">
                <module.Component />
              </SentryErrorBoundary>
            ),
          }
        },
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
