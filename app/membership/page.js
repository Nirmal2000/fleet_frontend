"use client"

import { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUser, useDescope } from '@descope/react-sdk'

export default function MembershipPage() {
  const { user, isUserLoading } = useUser()
  const { getSessionToken } = useDescope()

  const roleNames = useMemo(() => user?.roleNames || [], [user])
  const baseRole = roleNames[0] || 'free'
  const [effectiveRole, setEffectiveRole] = useState(baseRole)
  const [updating, setUpdating] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  // Keep local role in sync with SDK when user changes
  useEffect(() => {
    setEffectiveRole(baseRole)
  }, [baseRole])

  const selectRole = async (role) => {
    try {
      setUpdating(true)
      setStatusMsg('')
      const token =  getSessionToken?.()
      const res = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/membership/set-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ role })
      })
      const data = await res.json()
      if (!data?.success) throw new Error(data?.message || 'Failed to set role')
      // Optimistically update local role so UI reflects change immediately
      setEffectiveRole(role)
      setStatusMsg(`Role updated to ${role}.`)
    } catch (e) {
      console.error(e)
      setStatusMsg('Failed to update role')
    } finally {
      setUpdating(false)
    }
  }

  if (isUserLoading) {
    return <div className="min-h-screen bg-background text-foreground"><Navbar /><main className="max-w-5xl mx-auto p-6">Loading...</main></div>
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Membership</h1>
        <p className="text-muted-foreground mb-6">Current plan: <span className="font-medium">{effectiveRole}</span></p>

        {statusMsg && (
          <div className="mb-4 text-sm text-muted-foreground">{statusMsg}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className={`border-gray-700 ${effectiveRole === 'free' ? 'ring-1 ring-primary' : ''}`}>
            <CardContent className="p-6 space-y-3">
              <div className="text-xl font-semibold">Free</div>
              <div className="text-3xl font-bold">$0</div>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>free allows access to all free mcp tools</li>
              </ul>
              <Button onClick={() => selectRole('free')} disabled={updating || effectiveRole === 'free'}>
                {effectiveRole === 'free' ? 'Selected' : 'Choose Free'}
              </Button>
            </CardContent>
          </Card>

          <Card className={`border-gray-700 ${effectiveRole === 'premium' ? 'ring-1 ring-primary' : ''}`}>
            <CardContent className="p-6 space-y-3">
              <div className="text-xl font-semibold">Premium</div>
              <div className="text-3xl font-bold">$50</div>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>premium allows to create mcps and access all premium tools.</li>
              </ul>
              <Button onClick={() => selectRole('premium')} disabled={updating || effectiveRole === 'premium'}>
                {effectiveRole === 'premium' ? 'Selected' : 'Choose Premium'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-xs text-muted-foreground">
          This is a demo hackathon project. Selecting a plan updates your Descope role to either "free" or "premium". No payment is processed.
        </div>
      </main>
    </div>
  )
}
