"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDescope } from '@descope/react-sdk'
import { handleInboundCallback } from '@/lib/inboundAuth'

export default function InboundCallbackPage() {
  const router = useRouter()
  const { getSessionToken } = useDescope()

  useEffect(() => {
    (async () => {
      try {
        const token = getSessionToken?.()
        const action = await handleInboundCallback({ authToken: token })
        // If we saved an intended toggle, try it now
        if (action?.chatId && action?.mcpId) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/chat/${encodeURIComponent(action.chatId)}/toggle-mcp`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              },
              credentials: 'include', // include inbound access cookie
              body: JSON.stringify({ mcp_id: action.mcpId, enabled: true })
            })
          } catch {}
        }
      } catch (e) {
        console.warn('Inbound callback error', e)
      } finally {
        router.replace('/chat')
      }
    })()
  }, [getSessionToken, router])

  return null
}
