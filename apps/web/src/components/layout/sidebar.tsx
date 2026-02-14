import {
  CalendarDays,
  Clock,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom'
import { LanguageSelector } from '@/components/language-selector'
import { signOut } from '@/lib/auth-client'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

interface SidebarProps {
  organizationName: string
  onCollapsedChange?: (collapsed: boolean) => void
}

export function Sidebar({ organizationName, onCollapsedChange }: SidebarProps) {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navItems: NavItem[] = [
    { to: '/dashboard', label: t('sidebar.overview'), icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: '/dashboard/services', label: t('sidebar.services'), icon: <Package className="h-5 w-5" /> },
    { to: '/dashboard/appointments', label: t('sidebar.appointments'), icon: <CalendarDays className="h-5 w-5" /> },
    { to: '/dashboard/time-blocks', label: t('sidebar.timeBlocks'), icon: <Clock className="h-5 w-5" /> },
    { to: '/dashboard/settings', label: t('sidebar.settings'), icon: <Settings className="h-5 w-5" /> },
    { to: '/dashboard/subscription', label: t('sidebar.subscription'), icon: <CreditCard className="h-5 w-5" /> },
  ]
  async function handleSignOut() {
    await signOut()
    navigate('/auth/login', { replace: true })
  }
  function closeSidebar() {
    setIsOpen(false)
  }
  function toggleCollapsed() {
    const next = !isCollapsed
    setIsCollapsed(next)
    onCollapsedChange?.(next)
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-30 rounded-md bg-zinc-900 p-2 text-zinc-100 md:hidden"
        aria-label="Open menu"
        data-testid="sidebar-toggle"
      >
        <Menu className="h-5 w-5" />
      </button>
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeSidebar}
          aria-label="Close menu"
          data-testid="sidebar-backdrop"
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-zinc-900 text-zinc-100 transition-all md:static md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isCollapsed ? 'w-16' : 'w-64'}`}
        data-testid="sidebar"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-5">
          {isCollapsed ? null : (
            <div className="min-w-0">
              <p className="text-lg font-semibold">Schedulizer</p>
              <p className="truncate text-sm text-zinc-400">{organizationName}</p>
            </div>
          )}
          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-md p-1 text-zinc-400 hover:text-zinc-100 md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden rounded-md p-1 text-zinc-400 hover:text-zinc-100 md:block"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            data-testid="sidebar-collapse-toggle"
          >
            {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4" data-testid="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={closeSidebar}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isCollapsed ? 'justify-center' : ''} ${isActive ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`
              }
            >
              {item.icon}
              {isCollapsed ? null : item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-zinc-800 px-4 py-4 space-y-3">
          {isCollapsed ? null : <LanguageSelector variant="dark" />}
          <button
            type="button"
            onClick={handleSignOut}
            title={isCollapsed ? t('sidebar.signOut') : undefined}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 ${isCollapsed ? 'justify-center' : ''}`}
            data-testid="sign-out-button"
          >
            <LogOut className="h-5 w-5" />
            {isCollapsed ? null : t('sidebar.signOut')}
          </button>
        </div>
      </aside>
    </>
  )
}
