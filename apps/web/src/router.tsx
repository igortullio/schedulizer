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
