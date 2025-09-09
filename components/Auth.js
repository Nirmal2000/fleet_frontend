"use client"

import React, { useState } from 'react'
import { Descope, useSession } from '@descope/react-sdk'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function Auth() {
  const { isAuthenticated } = useSession()
  const router = useRouter()

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/chat')
    }
  }, [isAuthenticated, router])

  const onSuccess = (e) => {
    console.log('Authentication successful:', e)
    router.push('/chat')
  }

  const onError = (e) => {
    console.error('Authentication error:', e)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
              AI-Powered Platform
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">
              Welcome to Fleet
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Access your AI-powered sandboxed chats.
            </p>

            {/* Main Authentication Interface */}
            <div className="max-w-md mx-auto">
              <Card className="border border-white/10 shadow-2xl bg-white/5 backdrop-blur-lg">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl mb-3 text-white">Get Started</CardTitle>
                  <CardDescription className="text-slate-300">
                    Sign in to access the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                  <Descope
                    flowId="sign-up-or-in"
                    onSuccess={onSuccess}
                    onError={onError}
                    theme="dark"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* <footer className="py-12 px-4 border-t border-purple-500/20">
        <div className="container mx-auto text-center">
          <p className="text-slate-400">
            © 2024 Fleet. AI-powered sandbox chats.
          </p>
        </div>
      </footer> */}
    </div>
  )
}