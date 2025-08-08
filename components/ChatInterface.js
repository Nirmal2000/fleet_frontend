"use client"

import { useState, useEffect, useRef } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import MCPManager from '@/components/MCPManager'
import ChatSessionList from '@/components/ChatSessionList'
import SpinnerText from '@/components/SpinnerText'

// Utility function to parse and render message content with inline images
const parseMessageContent = (content) => {
  // Split content by newlines to process each line individually
  const lines = content.split('\n')
  
  return lines.map((line, lineIndex) => {
    // Check if this line contains a download URL
    const downloadUrlRegex = /Download URL: (https:\/\/[^\s]+\.(jpeg|jpg|png|gif|webp))/i
    const match = line.match(downloadUrlRegex)
    
    if (match) {
      const url = match[1]
      const beforeUrl = line.substring(0, match.index)
      const afterUrl = line.substring(match.index + match[0].length)
      
      return (
        <div key={lineIndex}>
          {beforeUrl && <span>{beforeUrl}</span>}
          <img 
            src={url} 
            alt="Generated content" 
            className="max-w-full h-auto my-2 rounded-lg border block"
            onError={(e) => {
              e.target.style.display = 'none'
              // Create a fallback text node
              const fallback = document.createElement('span')
              fallback.textContent = `[Image failed to load: ${url}]`
              fallback.className = 'text-muted-foreground text-sm italic'
              e.target.parentNode.insertBefore(fallback, e.target.nextSibling)
            }}
          />
          {afterUrl && <span>{afterUrl}</span>}
          {lineIndex < lines.length - 1 && <br />}
        </div>
      )
    }
    
    // Regular text line
    return (
      <span key={lineIndex}>
        {line}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    )
  }).filter(Boolean)
}

export default function ChatInterface({ session }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sandboxCreated, setSandboxCreated] = useState(false)
  const [chatId, setChatId] = useState(null)
  const [enabledMcps, setEnabledMcps] = useState([])
  const [streamController, setStreamController] = useState(null)
  const [sandboxError, setSandboxError] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])


  const generateDeviceId = () => {
    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    localStorage.setItem('device_id', deviceId)
    return deviceId
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sandboxCreated) return

    const userMessage = {
      role: 'user',
      content: inputMessage.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setLoading(true)
    
    const messageToSend = inputMessage.trim()
    setInputMessage('')

    try {
      // Cancel existing stream if any
      if (streamController) {
        streamController.abort()
      }

      // Get auth token
      const { data: { session: userSession } } = await supabase.auth.getSession()
      const deviceId = localStorage.getItem('device_id') || generateDeviceId()

      let assistantMessage = ''
      const controller = new AbortController()
      setStreamController(controller)

      await fetchEventSource(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/chat/${chatId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession?.access_token}`,
        },
        body: JSON.stringify({
          message: messageToSend,
          user_id: session.user.id,
          device_id: deviceId
        }),
        signal: controller.signal,
        onmessage(event) {
          try {
            const data = JSON.parse(event.data)
            
            if (data.error) {
              console.error('SSE error:', data.error)
              setSandboxError(data.error)
              setLoading(false)
              controller.abort()
              return
            }

            if (data.chunk === '.') {
              setIsProcessing(true)
              return
            }

            if (data.chunk) {
              setIsProcessing(false)
              assistantMessage += data.chunk
              // Update the last assistant message or add new one
              setMessages(prev => {
                const newMessages = [...prev]
                const lastMessage = newMessages[newMessages.length - 1]
                
                if (lastMessage && lastMessage.role === 'assistant') {
                  lastMessage.content = assistantMessage
                } else {
                  newMessages.push({
                    role: 'assistant',
                    content: assistantMessage
                  })
                }
                
                return newMessages
              })
            }

            if (data.done) {
              setIsProcessing(false)
              setLoading(false)
              setStreamController(null)
            }
          } catch (error) {
            console.error('Error parsing SSE data:', error)
          }
        },
        onerror(error) {
          console.error('SSE error:', error)
          setSandboxError('Connection lost to sandbox. Please reconnect.')
          setLoading(false)
          setIsProcessing(false)
          setStreamController(null)
          throw error // This will stop the stream
        }
      })

    } catch (error) {
      console.error('Error sending message:', error)
      setLoading(false)
      setIsProcessing(false)
      setStreamController(null)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleChatSelect = async (selectedChatId, isNewChat) => {
    // Reset current state
    setMessages([])
    setSandboxCreated(false)
    setInputMessage('')
    setLoading(false)
    setSandboxError(null)
    setIsProcessing(false)
    if (streamController) {
      streamController.abort()
      setStreamController(null)
    }
    
    setChatId(selectedChatId)
    
    // Single endpoint handles both new and existing chats
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
      
      const { data: { session: userSession } } = await supabase.auth.getSession()
      const deviceId = localStorage.getItem('device_id') || generateDeviceId()
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/connect-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession?.access_token}`
        },
        body: JSON.stringify({
          chat_id: chatId,
          user_id: session.user.id,
          device_id: deviceId
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update UI with initial data
        setMessages(data.chat_history || [])
        setEnabledMcps(data.enabled_mcps || [])
        
        if (data.sandbox_status === 'ready') {
          setSandboxCreated(true)
        } else if (data.sandbox_status === 'creating') {
          // Start polling for sandbox completion
          pollForSandboxReady(chatId, userSession?.access_token)
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

  const pollForSandboxReady = async (chatId, accessToken) => {
    const maxAttempts = 30 // 30 attempts * 2 seconds = 1 minute max
    let attempts = 0
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        alert('Sandbox creation is taking longer than expected. Please try refreshing the page.')
        return
      }
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/sandbox-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            chat_id: chatId,
            user_id: session.user.id
          })
        })
        
        const data = await response.json()
        
        if (data.success && data.sandbox_status === 'ready') {
          setSandboxCreated(true)
          return
        }
        
        attempts++
        setTimeout(poll, 5000) // Poll every 2 seconds
      } catch (error) {
        console.error('Error polling sandbox status:', error)
        attempts++
        setTimeout(poll, 2000)
      }
    }
    
    poll()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Fleet - AI Sandbox Chat</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{session.user.email}</span>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Sessions Sidebar */}
        <ChatSessionList 
          session={session} 
          onSelectChat={handleChatSelect}
          currentChatId={chatId}
        />
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!chatId ? (
            <div className="flex-1 flex items-center justify-center">
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-lg font-medium mb-2">Welcome to Fleet</h3>
                  <p className="text-muted-foreground">Select a chat session from the sidebar or create a new one to get started.</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
              <TabsList className="mx-4 mt-4 w-fit">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="mcps">MCPs</TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 flex flex-col m-4 mt-2 min-h-0 data-[state=active]:flex data-[state=inactive]:hidden">
                {sandboxError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Sandbox Connection Error</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>{sandboxError}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReconnect}
                        disabled={loading}
                        className="ml-4"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Reconnecting...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reconnect
                          </>
                        )}
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                {!sandboxCreated ? (
                  <Card className="flex-1 flex items-center justify-center">
                    <CardContent>
                      <div className="text-center space-y-4">
                        <h3 className="text-lg font-medium">Setting up sandbox...</h3>
                        <p className="text-muted-foreground">Please wait while we prepare your chat environment</p>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
              <>
                {/* Messages */}
                <Card className="flex-1 min-h-0 flex flex-col">
                  <CardContent className="flex-1 p-4 overflow-y-auto min-h-0">
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <div className="whitespace-pre-wrap font-sans text-sm">
                              {parseMessageContent(message.content)}
                              {message.role === 'assistant' && isProcessing && index === messages.length - 1 && <SpinnerText />}
                            </div>
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg px-4 py-2">
                            <div className="text-sm">Thinking...</div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </CardContent>
                </Card>

                {/* Input */}
                <div className="flex gap-2 mt-4">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={loading || !sandboxCreated}
                  />
                  <Button onClick={sendMessage} disabled={loading || !sandboxCreated || !inputMessage.trim()}>
                    Send
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

              <TabsContent value="mcps" className="flex-1 flex flex-col m-4 mt-2 min-h-0 data-[state=active]:flex data-[state=inactive]:hidden">
                <Card className="flex-1 min-h-0 flex flex-col">
                  <CardContent className="flex-1 p-4 overflow-y-auto min-h-0">
                    <MCPManager
                      enabledMcps={enabledMcps}
                      setEnabledMcps={setEnabledMcps}
                      sandboxCreated={sandboxCreated}
                      chatId={chatId}
                      session={session}
                      onReconnect={handleReconnect}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}