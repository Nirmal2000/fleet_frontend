"use client"

import { useEffect, useState, useCallback } from 'react'

export function useMcps() {
  const [mcps, setMcps] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchMcps = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/mcps`)
      const data = await res.json()
      if (data.success) setMcps(data.mcps)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMcps()
  }, [fetchMcps])

  return { mcps, loading, refetch: fetchMcps }
}

