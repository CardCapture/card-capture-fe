import { ChevronDown, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserDropdownProps {
  expanded?: boolean
}

export function UserDropdown({ expanded = false }: UserDropdownProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`w-full flex items-center justify-center gap-2 text-gray-700 hover:bg-blue-50 ${
            expanded ? 'justify-between px-2' : 'px-0'
          }`}
        >
          {expanded ? (
            <>
              <span className="text-sm truncate">{user.email}</span>
              <ChevronDown size={16} />
            </>
          ) : (
            <ChevronDown size={16} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={expanded ? "center" : "start"} className="w-56">
        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 cursor-pointer text-red-600"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 