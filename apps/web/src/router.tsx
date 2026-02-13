import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/auth-layout'
import { PublicLayout } from '@/components/layout/public-layout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/dashboard',
    lazy: () => import('@/routes/dashboard'),
  },
  {
    path: '/pricing',
    lazy: () => import('@/routes/pricing'),
  },
  {
    path: '/subscription',
    lazy: () => import('@/routes/subscription'),
  },
  {
    path: '/services',
    lazy: () => import('@/routes/services/index'),
  },
  {
    path: '/services/new',
    lazy: () => import('@/routes/services/new'),
  },
  {
    path: '/services/:serviceId/edit',
    lazy: () => import('@/routes/services/edit'),
  },
  {
    path: '/services/:serviceId/schedules',
    lazy: () => import('@/routes/services/schedules'),
  },
  {
    path: '/time-blocks',
    lazy: () => import('@/routes/time-blocks/index'),
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
