"use client"

import { useState, useEffect } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

// Modular components
import { ChatMessages } from '@/components/chat/ChatMessages'
import { ChatInput } from '@/components/chat/ChatInput'
import { SandboxStatus } from '@/components/chat/SandboxStatus'
import { WelcomeScreen } from '@/components/chat/WelcomeScreen'

// Hooks
import { useDeviceId } from '@/hooks/useDeviceId'
import { useSandbox } from '@/hooks/useSandbox'
import { useChat } from '@/hooks/useChat'
import { useDescope, useUser } from '@descope/react-sdk'

// Services
import { chatService } from '@/services/chatService'

// Existing components
import ChatSessionList from '@/components/ChatSessionList'
import { ChatHeader } from '@/components/chat/ChatHeader'

export default function ChatInterface() {
  const [chatId, setChatId] = useState(null)
  const [enabledMcps, setEnabledMcps] = useState([])
  const [loading, setLoading] = useState(false)
  const [isTabVisible, setIsTabVisible] = useState(true)

  // Descope hooks
  const { getSessionToken, logout } = useDescope()
  const { user } = useUser()

  // Custom hooks
  const { deviceId } = useDeviceId()
  const {
    sandboxCreated,
    sandboxError,
    setSandboxCreated,
    setSandboxError,
    pollForSandboxReady,
    resetSandbox
  } = useSandbox()
  
  const {
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    loading: chatLoading,
    isProcessing,
    messagesEndRef,
    sendMessage,
    resetChat,
    streamController
  } = useChat(chatId, deviceId)

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleChatSelect = async (selectedChatId, isNewChat) => {
    // Reset current state
    resetChat()
    resetSandbox()
    setEnabledMcps([])
    setLoading(false)
    
    setChatId(selectedChatId)
    
    // Connect to chat
    await connectToChat(selectedChatId)
  }

  const handleReconnect = async () => {
    if (chatId) {
      setSandboxError(null)
      await connectToChat(chatId)
    }
  }

  const connectToChat = async (chatId) => {
    try {
      setLoading(true)
      
      const data = await chatService.connectToChat(chatId, user.userId, deviceId, getSessionToken)
      
      if (data.success) {
        // Update UI with initial data
        setMessages(data.chat_history || [])
        setEnabledMcps(data.enabled_mcps || [])
        
        if (data.sandbox_status === 'ready') {
          setSandboxCreated(true)
        } else if (data.sandbox_status === 'creating') {
          // Start polling for sandbox completion
          pollForSandboxReady(chatId, null, user.userId, getSessionToken)
        }
      } else {
        throw new Error(data.message || 'Failed to connect to chat')
      }
    } catch (error) {
      console.error('Error connecting to chat:', error)
      alert('Failed to connect to chat: ' + error.message)
      setSandboxCreated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await chatService.signOut(logout)
  }

  const handleSendMessage = () => {
    sendMessage(setSandboxError)
  }

  return (
    <SidebarProvider>
      {/* Sidebar with logo, Create MCP, Sign Out */}
      <ChatSessionList
        user={user}
        onSelectChat={handleChatSelect}
        currentChatId={chatId}
      />

      {/* Main content area */}
      <SidebarInset className="bg-fleet-gradient">
        <div className="flex h-svh flex-col overflow-hidden">
          <ChatHeader user={user} onSignOut={handleSignOut} />
          <div className="flex-1 flex flex-col overflow-hidden">
            {!chatId ? (
              <WelcomeScreen />
            ) : !sandboxCreated ? (
              <div className="m-4">
                <SandboxStatus
                  sandboxError={sandboxError}
                  loading={loading}
                  onReconnect={handleReconnect}
                />
              </div>
            ) : (
              <>
                <ChatMessages
                  messages={messages}
                  loading={chatLoading}
                  isProcessing={isProcessing}
                  messagesEndRef={messagesEndRef}
                />
                <ChatInput
                  inputMessage={inputMessage}
                  setInputMessage={setInputMessage}
                  loading={chatLoading}
                  sandboxCreated={sandboxCreated}
                  onSendMessage={handleSendMessage}
                  chatId={chatId}
                />
              </>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
