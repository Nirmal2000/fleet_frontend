import { useState, useRef, useEffect } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { supabase } from '@/lib/supabase'

export function useChat(session, chatId, deviceId) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamController, setStreamController] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (setSandboxError) => {
    if (!inputMessage.trim()) return

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
        openWhenHidden: true,
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

            // Handle content streaming
            if (data.type === 'content') {
              setIsProcessing(false)
              assistantMessage += data.content
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

            // Handle tool messages
            if (data.type === 'tool') {
              // Reset assistant message when tool starts
              assistantMessage = ''
              
              setMessages(prev => {
                const newMessages = [...prev]
                const lastMessage = newMessages[newMessages.length - 1]
                
                // If last message is a tool message with same tool_name, update it
                if (lastMessage && lastMessage.role === 'tool' && lastMessage.tool_name === data.tool_name) {
                  // Update the existing tool message
                  lastMessage.state = data.state
                  if (data.input) lastMessage.input = { ...lastMessage.input, ...data.input }
                  if (data.output) lastMessage.output = data.output
                } else {
                  // Create new tool message
                  newMessages.push({
                    role: 'tool',
                    tool_name: data.tool_name,
                    state: data.state,
                    input: data.input || {},
                    output: data.output || null
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
          throw error
        }
      })

    } catch (error) {
      console.error('Error sending message:', error)
      setLoading(false)
      setIsProcessing(false)
      setStreamController(null)
    }
  }

  const resetChat = () => {
    setMessages([])
    setInputMessage('')
    setLoading(false)
    setIsProcessing(false)
    if (streamController) {
      streamController.abort()
      setStreamController(null)
    }
  }

  return {
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    loading,
    isProcessing,
    messagesEndRef,
    sendMessage,
    resetChat,
    streamController
  }
}