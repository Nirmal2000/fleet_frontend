"use client"

import React from 'react'
import Link from 'next/link'
// import { usePathname } from 'next/navigation'
import { useSession, useDescope, useUser } from '@descope/react-sdk'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Zap, Plus, LogOut, MessageCircle, Crown, Store } from 'lucide-react'

export default function Navbar() {
  const { isAuthenticated } = useSession()
  const { user } = useUser()
  const { logout } = useDescope()
  // const pathname = usePathname()

  const handleSignOut = () => {
    logout()
  }


  return (
    <header className="w-full border-b border-white/10 bg-fleet-gradient sticky top-0 z-50">
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="rounded-full px-2 h-8">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user?.picture} alt={user?.name || "User"} />
                          <AvatarFallback>
                            {user?.name?.[0] || user?.userId?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="max-w-[140px] truncate text-sm">
                          {user?.name || user?.userId || 'User'}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="cursor-pointer">
                      <Link href="/chat" className="flex items-center w-full">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Chat
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Link href="/create" className="flex items-center w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Create MCP
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Link href="/marketplace" className="flex items-center w-full">
                        <Store className="mr-2 h-4 w-4" />
                        Marketplace
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Link href="/membership" className="flex items-center w-full">
                        <Crown className="mr-2 h-4 w-4" />
                        Membership
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
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
