import { useState } from 'react'
import { CalendarDays, Camera, Cog, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLocation, Link } from 'react-router-dom'
import { CCLogo } from './CCLogo'
import { UserDropdown } from './UserDropdown'
import { useRole } from '@/hooks/useRole'
import { useIsMobile } from '@/hooks/use-mobile'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isMobile = useIsMobile()
  const { canAccessScanPage, canAccessEventsPage, canAccessSettings } = useRole()

  // Filter navigation items based on permissions
  const navItems = [
    { href: '/events', label: 'Events', icon: <CalendarDays />, canAccess: canAccessEventsPage },
    { href: '/scan', label: 'Scan', icon: <Camera />, canAccess: canAccessScanPage },
  ].filter(item => item.canAccess)

  const bottomItems = [
    { href: '/settings/account-settings', label: 'Settings', icon: <Cog />, canAccess: canAccessSettings },
  ].filter(item => item.canAccess)

  // Mobile Navigation Component
  const MobileNav = () => (
    <>
      {/* Mobile Menu Button */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-50 bg-white shadow-md hover:bg-gray-50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            {/* Mobile Logo */}
            <div className="flex items-center p-4 border-b">
              <CCLogo expanded={true} />
              <span className="ml-2 font-semibold">CardCapture</span>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-blue-50 transition-colors min-h-[44px]',
                    location.pathname === item.href
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : ''
                  )}
                >
                  <span className="w-5 h-5">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Mobile Bottom Section */}
            <div className="border-t">
              <div className="px-2 py-2 space-y-1">
                {bottomItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-blue-50 transition-colors min-h-[44px]',
                      location.pathname === item.href
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                        : ''
                    )}
                  >
                    <span className="w-5 h-5">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
              
              {/* Mobile User Dropdown */}
              <div className="px-2 py-2 border-t">
                <UserDropdown expanded={true} />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )

  // Desktop Sidebar Component
  const DesktopSidebar = () => (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-200',
        expanded ? 'w-48' : 'w-16'
      )}
    >
      {/* Desktop Logo & Toggle */}
      <div 
        className={cn(
          'flex items-center cursor-pointer border-b border-gray-200',
          expanded ? 'p-4 justify-between' : 'p-2 justify-center'
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-center w-full" style={{ minHeight: '56px' }}>
          <CCLogo expanded={expanded} />
          {expanded && <span className="ml-2 font-semibold">CardCapture</span>}
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="flex-1 px-1 py-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-r-lg px-2 py-2 text-gray-700 hover:bg-blue-50 transition-colors',
              location.pathname === item.href
                ? 'border-l-4 border-blue-600 bg-blue-50 text-blue-600'
                : expanded
                  ? ''
                  : 'justify-center'
            )}
          >
            <span className="w-5 h-5">{item.icon}</span>
            {expanded && <span className="font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Desktop Bottom Section */}
      <div className="border-t border-gray-200">
        <div className="px-1 py-2 space-y-1">
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-r-lg px-2 py-2 text-gray-700 hover:bg-blue-50 transition-colors',
                location.pathname === item.href
                  ? 'border-l-4 border-blue-600 bg-blue-50 text-blue-600'
                  : expanded
                    ? ''
                    : 'justify-center'
              )}
            >
              <span className="w-5 h-5">{item.icon}</span>
              {expanded && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </div>

        {/* Desktop User Dropdown */}
        <div className="px-2 py-2 border-t border-gray-200">
          <UserDropdown expanded={expanded} />
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {isMobile ? <MobileNav /> : <DesktopSidebar />}
    </>
  )
} 