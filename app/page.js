"use client"

import { useSession, useUser } from '@descope/react-sdk'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Auth from '@/components/Auth'

export default function Home() {
  const { isAuthenticated, isSessionLoading } = useSession()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  console.log('User:', user)

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chat')
    }
  }, [isAuthenticated, router])

  if (isSessionLoading || isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Auth />
  }

  return null // Will redirect to /chat
}
