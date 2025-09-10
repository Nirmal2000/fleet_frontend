"use client"

import { useEffect, useState, useCallback } from 'react'

export function useOutboundApps(getSessionToken) {
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchOutboundApps = useCallback(async () => {
    try {
      setLoading(true)
      const token = getSessionToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/outbound-apps`, { headers })
      const data = await res.json()
      // Assumption: app name is under name || displayName || id
      // Printing full response for verification/debugging.
      console.log('Outbound apps raw response', data)
      if (data.success) {
        const apps = Array.isArray(data.apps) ? data.apps : []
        let items = apps.map((app) => ({
          id: app.id,
          name: app.name,
          connected: false, // Placeholder until checked below
          raw: app,
        }))
        // Fetch connection status for each app (requires auth)
        if (token && items.length) {
          const checks = await Promise.allSettled(
            items.map(async (it) => {
              const resp = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/outbound-apps/${encodeURIComponent(it.id)}/connected`, { headers })
              if (!resp.ok) return { id: it.id, connected: false }
              const body = await resp.json()
              return { id: it.id, connected: !!body.connected }
            })
          )
          const byId = new Map()
          checks.forEach((r) => {
            if (r.status === 'fulfilled') byId.set(r.value.id, r.value.connected)
          })
          items = items.map((it) => ({ ...it, connected: !!byId.get(it.id) }))
        }
        setIntegrations(items)
      }
    } catch (e) {
      console.warn('Failed to load outbound apps', e)
    } finally {
      setLoading(false)
    }
  }, [getSessionToken])

  useEffect(() => {
    fetchOutboundApps()
  }, [fetchOutboundApps])

  return { integrations, loading, refetch: fetchOutboundApps }
}
