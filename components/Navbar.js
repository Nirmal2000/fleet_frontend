"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, useDescope } from '@descope/react-sdk'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Zap, Plus, LogOut, MessageCircle } from 'lucide-react'

export default function Navbar() {
  const { isAuthenticated, user } = useSession()
  const { logout } = useDescope()
  const pathname = usePathname()

  const handleSignOut = () => {
    logout()
  }

  const isActive = (path) => pathname === path

  return (
    <header className="w-full border-b border-white/10 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="w-full px-4 py-4">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          {/* Left side - Logo and Title */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Fleet
            </span>
          </div>

          {/* Right side - Navigation */}
          <nav className="flex items-center space-x-2">
            {isAuthenticated && (
              <>
                {pathname !== '/chat' && (
                  <Link
                    href="/chat"
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors border ${
                      isActive('/chat')
                        ? 'text-primary border-primary bg-primary/10'
                        : 'text-foreground hover:text-primary border-transparent hover:border-gray-600'
                    }`}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat
                  </Link>
                )}

                {pathname !== '/create' && (
                  <Link
                    href="/create"
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors border ${
                      isActive('/create')
                        ? 'text-primary border-primary bg-primary/10'
                        : 'text-foreground hover:text-primary border-transparent hover:border-gray-600'
                    }`}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create MCP
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="rounded-full p-0 w-8 h-8">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user?.picture} alt={user?.name || "User"} />
                        <AvatarFallback>
                          {user?.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
