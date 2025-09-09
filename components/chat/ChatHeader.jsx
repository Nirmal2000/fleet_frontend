import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, LogOut, Zap } from 'lucide-react'

export function ChatHeader({ user, onSignOut }) {
  return (
    <header className="bg-background z-10 flex h-16 w-full shrink-0 items-center gap-2 border-b px-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-500 rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-black" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Fleet
        </span>
      </div>
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1" />
      <nav className="flex items-center gap-2">
        <Button asChild variant="outline">
          <Link href="/create" className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Create MCP
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="rounded-full p-0 w-8 h-8">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.picture} alt={user?.name || "User"} />
                <AvatarFallback>
                  {user?.name?.[0] || user?.userId?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onSignOut} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  )
}
