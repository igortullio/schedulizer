import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@igortullio-ui/react'
import {
  Building2,
  CalendarDays,
  Check,
  ChevronsUpDown,
  Clock,
  LayoutDashboard,
  Loader2,
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
import { authClient, signOut } from '@/lib/auth-client'

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
  const [isOrgPopoverOpen, setIsOrgPopoverOpen] = useState(false)
  const { data: organizations, isPending: isLoadingOrgs } = authClient.useListOrganizations()
  const navItems: NavItem[] = [
    { to: '/dashboard', label: t('sidebar.overview'), icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: '/dashboard/services', label: t('sidebar.services'), icon: <Package className="h-5 w-5" /> },
    { to: '/dashboard/appointments', label: t('sidebar.appointments'), icon: <CalendarDays className="h-5 w-5" /> },
    { to: '/dashboard/time-blocks', label: t('sidebar.timeBlocks'), icon: <Clock className="h-5 w-5" /> },
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
  async function handleOrgSelect(organizationId: string) {
    const response = await authClient.organization.setActive({ organizationId })
    if (!response.error) {
      setIsOrgPopoverOpen(false)
      window.location.reload()
    }
  }
  const orgPopoverContent = (
    <PopoverContent className="w-56 p-1" side={isCollapsed ? 'right' : 'bottom'} align="start">
      {isLoadingOrgs ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : (
        <ul className="space-y-0.5" aria-label="Organizations">
          {organizations?.map((org: { id: string; name: string }) => (
            <li key={org.id}>
              <button
                type="button"
                onClick={() => handleOrgSelect(org.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
              >
                <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{org.name}</span>
                {org.name === organizationName ? (
                  <Check className="ml-auto h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </PopoverContent>
  )
  return (
    <TooltipProvider delayDuration={300}>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-30 rounded-md bg-sidebar p-2 text-sidebar-foreground md:hidden"
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
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-all md:static md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isCollapsed ? 'w-16' : 'w-64'}`}
        data-testid="sidebar"
      >
        <div
          className={`flex border-b border-sidebar-border px-4 py-5 ${isCollapsed ? 'flex-col items-center gap-2' : 'items-center justify-between'}`}
        >
          {isCollapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Popover open={isOrgPopoverOpen} onOpenChange={setIsOrgPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center justify-center rounded-md p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                        data-testid="org-switcher"
                      >
                        <Building2 className="h-5 w-5" />
                      </button>
                    </PopoverTrigger>
                    {orgPopoverContent}
                  </Popover>
                </TooltipTrigger>
                <TooltipContent side="right">{organizationName}</TooltipContent>
              </Tooltip>
              <button
                type="button"
                onClick={toggleCollapsed}
                className="hidden rounded-md p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground md:block"
                aria-label="Expand sidebar"
                data-testid="sidebar-collapse-toggle"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <Popover open={isOrgPopoverOpen} onOpenChange={setIsOrgPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 text-left hover:bg-sidebar-accent"
                    data-testid="org-switcher"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{organizationName}</p>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
                  </button>
                </PopoverTrigger>
                {orgPopoverContent}
              </Popover>
              <button
                type="button"
                onClick={closeSidebar}
                className="rounded-md p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground md:hidden"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={toggleCollapsed}
                className="hidden rounded-md p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground md:block"
                aria-label="Collapse sidebar"
                data-testid="sidebar-collapse-toggle"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4" data-testid="sidebar-nav">
          {navItems.map(item =>
            isCollapsed ? (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.to}
                    end={item.to === '/dashboard'}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `flex items-center justify-center gap-3 rounded-md py-2 px-0 text-sm font-medium transition-colors ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`
                    }
                  >
                    {item.icon}
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md py-2 px-3 text-sm font-medium transition-colors ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
        <div className="border-t border-sidebar-border px-3 py-4 space-y-1">
          {isCollapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    to="/dashboard/settings"
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `flex items-center justify-center gap-3 rounded-md py-2 px-0 text-sm font-medium transition-colors ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`
                    }
                  >
                    <Settings className="h-5 w-5" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right">{t('sidebar.settings')}</TooltipContent>
              </Tooltip>
              <LanguageSelector isCollapsed />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center justify-center gap-3 rounded-md py-2 px-0 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    data-testid="sign-out-button"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{t('sidebar.signOut')}</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <NavLink
                to="/dashboard/settings"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md py-2 px-3 text-sm font-medium transition-colors ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`
                }
              >
                <Settings className="h-5 w-5" />
                {t('sidebar.settings')}
              </NavLink>
              <LanguageSelector isCollapsed={false} />
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-md py-2 px-3 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                data-testid="sign-out-button"
              >
                <LogOut className="h-5 w-5" />
                {t('sidebar.signOut')}
              </button>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
