"use client"

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SidebarProvider } from '@/components/ui/sidebar'

// Modular components
import { ChatHeader } from '@/components/chat/ChatHeader'
import { ChatMessages } from '@/components/chat/ChatMessages'
import { ChatInput } from '@/components/chat/ChatInput'
import { SandboxStatus } from '@/components/chat/SandboxStatus'
import { WelcomeScreen } from '@/components/chat/WelcomeScreen'

// Hooks
import { useDeviceId } from '@/hooks/useDeviceId'
import { useSandbox } from '@/hooks/useSandbox'
import { useChat } from '@/hooks/useChat'

// Services
import { chatService } from '@/services/chatService'

// Existing components
import MCPManager from '@/components/MCPManager'
import ChatSessionList from '@/components/ChatSessionList'
import WorkflowsTab from '@/components/WorkflowsTab'

export default function ChatInterface({ session }) {
  const [chatId, setChatId] = useState(null)
  const [enabledMcps, setEnabledMcps] = useState([])
  const [loading, setLoading] = useState(false)
  const [isTabVisible, setIsTabVisible] = useState(true)

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
  } = useChat(session, chatId, deviceId)

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
      
      const data = await chatService.connectToChat(chatId, session.user.id, deviceId)
      
      if (data.success) {
        // Update UI with initial data
        setMessages(data.chat_history || [])
        setEnabledMcps(data.enabled_mcps || [])
        
        if (data.sandbox_status === 'ready') {
          setSandboxCreated(true)
        } else if (data.sandbox_status === 'creating') {
          // Start polling for sandbox completion
          pollForSandboxReady(chatId, null, session.user.id)
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
    await chatService.signOut()
  }

  const handleSendMessage = () => {
    sendMessage(setSandboxError)
  }

  return (
    <SidebarProvider>
      {/* Chat Sessions Sidebar */}
      <ChatSessionList
        session={session}
        onSelectChat={handleChatSelect}
        currentChatId={chatId}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <ChatHeader session={session} onSignOut={handleSignOut} />

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!chatId ? (
            <WelcomeScreen />
          ) : (
            <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
              <TabsList className="mx-4 mt-4 w-fit">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                {/* <TabsTrigger value="mcps">MCPs</TabsTrigger> */}
                <TabsTrigger value="workflows">Workflows</TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 flex flex-col m-4 mt-2 min-h-0 data-[state=active]:flex data-[state=inactive]:hidden">
                {!sandboxCreated ? (
                  <SandboxStatus 
                    sandboxError={sandboxError} 
                    loading={loading} 
                    onReconnect={handleReconnect} 
                  />
                ) : (
                  <>
                    {/* Messages */}
                    <ChatMessages
                      messages={messages}
                      loading={chatLoading}
                      isProcessing={isProcessing}
                      messagesEndRef={messagesEndRef}
                    />

                    {/* Input */}
                    <ChatInput
                      inputMessage={inputMessage}
                      setInputMessage={setInputMessage}
                      loading={chatLoading}
                      sandboxCreated={sandboxCreated}
                      onSendMessage={handleSendMessage}
                    />
                  </>
                )}
              </TabsContent>

              {/* <TabsContent value="mcps" className="flex-1 flex flex-col m-4 mt-2 min-h-0 data-[state=active]:flex data-[state=inactive]:hidden">
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="flex-1 p-4 overflow-y-auto min-h-0">
                    <MCPManager
                      enabledMcps={enabledMcps}
                      setEnabledMcps={setEnabledMcps}
                      sandboxCreated={sandboxCreated}
                      chatId={chatId}
                      session={session}
                      onReconnect={handleReconnect}
                    />
                  </div>
                </div>
              </TabsContent> */}

              <TabsContent value="workflows" className="flex-1 flex flex-col m-4 mt-2 min-h-0 data-[state=active]:flex data-[state=inactive]:hidden">
                <div className="flex-1 min-h-0 flex flex-col">
                  <WorkflowsTab />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </SidebarProvider>
  )
}