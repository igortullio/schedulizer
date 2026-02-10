import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/auth-layout'

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
    path: '/checkout/success',
    lazy: () => import('@/routes/checkout/success'),
  },
  {
    path: '/checkout/cancel',
    lazy: () => import('@/routes/checkout/cancel'),
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
