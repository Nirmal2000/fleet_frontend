import { useState, useRef, useEffect } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useDescope, useSession, useUser } from '@descope/react-sdk'

export function useChat(chatId, deviceId) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamController, setStreamController] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef(null)

  const { getSessionToken } = useDescope()
  const { user } = useUser()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (setSandboxError) => {
    if (!inputMessage.trim()) return

    if (!user || !getSessionToken) {
      console.error('User not authenticated')
      return
    }

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
      const sessionToken = getSessionToken()

      let assistantMessage = ''
      const controller = new AbortController()
      setStreamController(controller)

      await fetchEventSource(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/chat/${chatId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          message: messageToSend,
          user_id: user.userId,
          device_id: deviceId
        }),
        signal: controller.signal,
        openWhenHidden: true,
        onmessage(event) {
          try {
            if (!event.data | event.data === '.') return
            console.log('SSE event data:', event.data)
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

            // Handle assistant message with tool_calls (OR format)
            if (data.type === 'assistant_message' && data.message) {
              // Only render assistant content; ignore tool_calls in UI
              const assistant = { role: 'assistant', content: data.message.content || '' }
              setMessages(prev => {
                const newMessages = [...prev]
                const last = newMessages[newMessages.length - 1]
                if (last && last.role === 'assistant') {
                  newMessages[newMessages.length - 1] = assistant
                } else {
                  newMessages.push(assistant)
                }
                return newMessages
              })
            }

            // Handle tool messages (always render with <Tool> component)
            if (data.type === 'tool') {
              // Reset assistant accumulation when a tool starts
              if (data.state === 'input-streaming') {
                assistantMessage = ''
              }

              setMessages(prev => {
                const newMessages = [...prev]
                const lastMessage = newMessages[newMessages.length - 1]

                // If last message is a tool message with same tool_name, update it
                if (lastMessage && lastMessage.role === 'tool' && lastMessage.tool_name === data.tool_name) {
                  lastMessage.state = data.state
                  if (data.input) lastMessage.input = { ...(lastMessage.input || {}), ...data.input }
                  if (data.output) lastMessage.output = data.output
                } else {
                  // Create/append a streaming tool message for <Tool>
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
