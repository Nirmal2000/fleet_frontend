"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus } from 'lucide-react'

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
      <div className="w-80 border-r bg-muted/30 p-4">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="w-80 border-r bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Chat Sessions</h2>
          <Button size="sm" onClick={handleNewChat}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {chatSessions.length === 0 ? (
            <Card className="m-2">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">No chat sessions yet</p>
                <Button onClick={handleNewChat} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Chat
                </Button>
              </CardContent>
            </Card>
          ) : (
            chatSessions.map((chatSession) => (
              <Card 
                key={chatSession.chat_id}
                className={`m-2 cursor-pointer transition-colors hover:bg-accent ${
                  currentChatId === chatSession.chat_id ? 'bg-accent border-primary' : ''
                }`}
                onClick={() => onSelectChat(chatSession.chat_id, false)}
              >
                <CardContent className="p-3">
                  <div className="space-y-1">
                    <div className="font-medium text-sm truncate">
                      {chatSession.chat_id.replace('chat_', '').substring(0, 20)}...
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(chatSession.last_activity)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}