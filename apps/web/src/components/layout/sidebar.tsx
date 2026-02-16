import {
  Button,
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
  Plus,
  Settings,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom'
import { LanguageSelector } from '@/components/language-selector'
import { useSubscriptionContext } from '@/contexts/subscription-context'
import { authClient, signOut } from '@/lib/auth-client'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  badge?: number
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
  const { usage } = useSubscriptionContext()
  const servicesCount = usage?.services.current ?? 0
  const navItems: NavItem[] = [
    { to: '/dashboard', label: t('sidebar.overview'), icon: <LayoutDashboard className="h-5 w-5" /> },
    {
      to: '/dashboard/services',
      label: t('sidebar.services'),
      icon: <Package className="h-5 w-5" />,
      badge: servicesCount,
    },
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
  function handleCreateNewOrg() {
    setIsOrgPopoverOpen(false)
    closeSidebar()
    navigate('/auth/org-select')
  }
  const orgPopoverContent = (
    <PopoverContent className="w-56 p-1" side={isCollapsed ? 'right' : 'bottom'} align="start">
      {isLoadingOrgs ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : (
        <>
          <ul className="space-y-0.5" aria-label="Organizations">
            {organizations?.map((org: { id: string; name: string }) => (
              <li key={org.id}>
                <Button
                  variant="ghost"
                  onClick={() => handleOrgSelect(org.id)}
                  className="h-auto w-full justify-start gap-2 px-2 py-1.5 text-sm"
                >
                  <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{org.name}</span>
                  {org.name === organizationName ? (
                    <Check className="ml-auto h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  ) : null}
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-1 border-t border-border pt-1">
            <Button
              variant="ghost"
              onClick={handleCreateNewOrg}
              className="h-auto w-full justify-start gap-2 px-2 py-1.5 text-sm"
              data-testid="create-new-org-button"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t('orgSelect.createNewOrg', { ns: 'auth' })}</span>
            </Button>
          </div>
        </>
      )}
    </PopoverContent>
  )
  return (
    <TooltipProvider delayDuration={300}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-30 bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground md:hidden"
        aria-label="Open menu"
        data-testid="sidebar-toggle"
      >
        <Menu className="h-5 w-5" />
      </Button>
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 h-auto w-auto cursor-default border-none bg-black/50 md:hidden"
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
          className={`flex border-b border-sidebar-border py-5 ${isCollapsed ? 'flex-col items-center gap-2 px-3' : 'items-center justify-between px-4'}`}
        >
          {isCollapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Popover open={isOrgPopoverOpen} onOpenChange={setIsOrgPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-full text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        data-testid="org-switcher"
                      >
                        <Building2 className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    {orgPopoverContent}
                  </Popover>
                </TooltipTrigger>
                <TooltipContent side="right">{organizationName}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleCollapsed}
                    className="hidden w-full text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground md:flex"
                    aria-label={t('sidebar.expand')}
                    data-testid="sidebar-collapse-toggle"
                  >
                    <PanelLeftOpen className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{t('sidebar.expand')}</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Popover open={isOrgPopoverOpen} onOpenChange={setIsOrgPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-auto min-w-0 flex-1 gap-2 p-1 text-left hover:bg-sidebar-accent"
                    data-testid="org-switcher"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{organizationName}</p>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
                  </Button>
                </PopoverTrigger>
                {orgPopoverContent}
              </Popover>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeSidebar}
                className="h-auto w-auto p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground md:hidden"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleCollapsed}
                    className="hidden h-auto w-auto p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground md:block"
                    aria-label={t('sidebar.collapse')}
                    data-testid="sidebar-collapse-toggle"
                  >
                    <PanelLeftClose className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{t('sidebar.collapse')}</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
        <nav
          className={`flex-1 py-4 ${isCollapsed ? 'flex flex-col items-center gap-1 px-3' : 'space-y-1 px-3'}`}
          data-testid="sidebar-nav"
        >
          {navItems.map(item =>
            isCollapsed ? (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>
                  <span className="relative">
                    <NavLink
                      to={item.to}
                      end={item.to === '/dashboard'}
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        `flex w-full items-center justify-center rounded-md p-2 text-sm font-medium transition-colors ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`
                      }
                    >
                      {item.icon}
                    </NavLink>
                    {item.badge ? (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                        {item.badge}
                      </span>
                    ) : null}
                  </span>
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
                {item.badge ? (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-xs font-medium text-primary">
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            ),
          )}
        </nav>
        <div
          className={`border-t border-sidebar-border py-4 ${isCollapsed ? 'flex flex-col items-center gap-1 px-3' : 'space-y-1 px-3'}`}
        >
          {isCollapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <NavLink
                      to="/dashboard/settings"
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        `flex w-full items-center justify-center rounded-md p-2 text-sm font-medium transition-colors ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`
                      }
                    >
                      <Settings className="h-5 w-5" />
                    </NavLink>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right">{t('sidebar.settings')}</TooltipContent>
              </Tooltip>
              <LanguageSelector isCollapsed />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-center gap-3 px-0 py-2 text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    data-testid="sign-out-button"
                  >
                    <LogOut className="size-5!" />
                  </Button>
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
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                data-testid="sign-out-button"
              >
                <LogOut className="size-5!" />
                {t('sidebar.signOut')}
              </Button>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
