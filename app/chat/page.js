"use client"

import { useSession } from '@descope/react-sdk'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ChatInterface from '@/components/ChatInterface'

export default function ChatPage() {
  const { isAuthenticated } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return <ChatInterface />
}