import { createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
  {
    path: '/',
    lazy: () => import('@/routes/home'),
  },
  {
    path: '/privacy',
    lazy: () => import('@/routes/privacy-policy'),
  },
])
