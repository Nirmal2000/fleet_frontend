"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { Plus, Search } from 'lucide-react'

export default function ChatSessionList({ session, onSelectChat, currentChatId }) {
  const [chatSessions, setChatSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChatSessions()
  }, [session.user.id])

  const loadChatSessions = async () => {
    try {
      setLoading(true)
      const { data: { session: userSession } } = await supabase.auth.getSession()
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/user/${session.user.id}/sessions`, {
        headers: {
          'Authorization': `Bearer ${userSession?.access_token}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setChatSessions(data.sessions)
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = async () => {
    const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    onSelectChat(newChatId, true) // true indicates new chat - will trigger sandbox creation
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Unknown'
    }
  }

  if (loading) {
    return (
      <Sidebar>
        <SidebarContent className="pt-4">
          <div className="text-sm text-muted-foreground p-4">Loading...</div>
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row items-center justify-between gap-2 px-2 py-4">
        <div className="flex flex-row items-center gap-2 px-2">
          <div className="bg-primary/10 size-8 rounded-md"></div>
          <div className="text-md font-base text-primary tracking-tight">
            Fleet
          </div>
        </div>
        <Button variant="ghost" className="size-8">
          <Search className="size-4" />
        </Button>
      </SidebarHeader>
      <SidebarContent className="pt-4">
        <div className="px-4">
          <Button
            variant="outline"
            className="mb-4 flex w-full items-center gap-2"
            onClick={handleNewChat}
          >
            <Plus className="size-4" />
            <span>New Chat</span>
          </Button>
        </div>

        {chatSessions.length === 0 ? (
          <SidebarGroup>
            <SidebarMenu>
              <div className="px-4 py-2 text-center">
                <p className="text-sm text-muted-foreground mb-3">No chat sessions yet</p>
                <Button onClick={handleNewChat} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Chat
                </Button>
              </div>
            </SidebarMenu>
          </SidebarGroup>
        ) : (
          <SidebarGroup>
            <SidebarMenu>
              {chatSessions.map((chatSession, index) => (
                <SidebarMenuButton
                  key={chatSession.chat_id}
                  onClick={() => onSelectChat(chatSession.chat_id, false)}
                  className={currentChatId === chatSession.chat_id ? 'bg-accent border-primary' : ''}
                >
                  <span>Chat {index + 1}</span>
                </SidebarMenuButton>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}