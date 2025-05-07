import { useState } from 'react'
import { CalendarDays, Camera, Cog, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLocation, Link } from 'react-router-dom'
import { CCLogo } from './CCLogo'
import { UserDropdown } from './UserDropdown'

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false)
  const location = useLocation()

  const navItems = [
    { href: '/events', label: 'Events', icon: <CalendarDays /> },
    { href: '/scan', label: 'Scan', icon: <Camera /> },
  ]
  const bottomItems = [
    { href: '/users', label: 'Users', icon: <User /> },
    { href: '/settings', label: 'Settings', icon: <Cog /> },
  ]

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-200',
        expanded ? 'w-48' : 'w-16'
      )}
    >
      {/* Logo & App Name */}
      <div 
        className={cn(
          'flex items-center cursor-pointer',
          expanded ? 'p-4 justify-between' : 'p-2 justify-center'
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-center w-full" style={{ minHeight: '56px' }}>
          <CCLogo expanded={expanded} />
          {expanded && <span className="ml-2 font-semibold">CardCapture</span>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-blue-600 hover:bg-blue-50"
        >
          {expanded ? <ChevronLeft /> : <ChevronRight />}
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-r-lg px-2 py-2 text-gray-700 hover:bg-blue-50',
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

      {/* Bottom Section */}
      <div className="px-1 space-y-1 mb-4">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-r-lg px-2 py-2 text-gray-700 hover:bg-blue-50',
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

      {/* User Dropdown */}
      <div className="px-2 py-2 border-t border-gray-200">
        <UserDropdown expanded={expanded} />
      </div>
    </aside>
  )
} 