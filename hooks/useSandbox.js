import { useState } from 'react'
import { chatService } from '@/services/chatService'

export function useSandbox() {
  const [sandboxCreated, setSandboxCreated] = useState(false)
  const [sandboxError, setSandboxError] = useState(null)

  const pollForSandboxReady = async (chatId, accessToken, userId) => {
    const maxAttempts = 30 // 30 attempts * 2 seconds = 1 minute max
    let attempts = 0
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        alert('Sandbox creation is taking longer than expected. Please try refreshing the page.')
        return
      }
      
      try {
        const data = await chatService.getSandboxStatus(chatId, userId)
        
        if (data.success && data.sandbox_status === 'ready') {
          setSandboxCreated(true)
          return
        }
        
        attempts++
        setTimeout(poll, 5000) // Poll every 5 seconds
      } catch (error) {
        console.error('Error polling sandbox status:', error)
        attempts++
        setTimeout(poll, 2000)
      }
    }
    
    poll()
  }

  const resetSandbox = () => {
    setSandboxCreated(false)
    setSandboxError(null)
  }

  return {
    sandboxCreated,
    sandboxError,
    setSandboxCreated,
    setSandboxError,
    pollForSandboxReady,
    resetSandbox
  }
}