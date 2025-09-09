"use client"

import { useEffect, useRef, useState } from 'react'

// Polls running MCP validation tasks stored in localStorage under 'mcp_task_ids'.
// Calls onChange when tasks complete and are removed.
export function useMcpTasks(onChange) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const initializedRef = useRef(false)
  const prevStatusRef = useRef(new Map()) // id -> status

  const fetchTasks = async () => {
    try {
      const key = 'mcp_task_ids'
      const ids = JSON.parse(localStorage.getItem(key) || '[]')
      if (!ids.length) {
        setTasks([])
        prevStatusRef.current = new Map()
        initializedRef.current = true
        return
      }
      if (!initializedRef.current) setLoading(true)

      const idsToKeep = []
      const idsToRemove = []
      const running = []

      await Promise.all(ids.map(async (id) => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/mcp/tasks/${id}`)
          if (!res.ok) {
            idsToRemove.push(id)
            return
          }
          const data = await res.json()
          if (!data?.success) {
            const msg = (data?.message || '').toLowerCase()
            if (msg.includes('not found')) {
              idsToRemove.push(id)
            } else {
              idsToKeep.push(id)
            }
            return
          }
          const task = { id, ...data.task }
          if (task.status === 'pending' || task.status === 'running') {
            running.push(task)
            idsToKeep.push(id)
          } else {
            idsToRemove.push(id)
          }
        } catch {
          idsToKeep.push(id)
        }
      }))

      // Update stored ids if changed
      const normalizedKeep = Array.from(new Set(idsToKeep))
      if (normalizedKeep.length !== ids.length || idsToRemove.length > 0) {
        localStorage.setItem(key, JSON.stringify(normalizedKeep))
      }

      // Only update state if statuses changed
      const nextStatusMap = new Map(running.map(t => [t.id, t.status]))
      let changed = running.length !== tasks.length || nextStatusMap.size !== prevStatusRef.current.size
      if (!changed) {
        for (const [id, status] of nextStatusMap.entries()) {
          if (prevStatusRef.current.get(id) !== status) { changed = true; break }
        }
      }
      if (changed) {
        setTasks(running)
        prevStatusRef.current = nextStatusMap
      }

      if (onChange && idsToRemove.length > 0) {
        try { onChange({ running, removedIds: idsToRemove, keptIds: normalizedKeep }) } catch {}
      }

    } finally {
      initializedRef.current = true
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
    const t = setInterval(fetchTasks, 4000)
    return () => clearInterval(t)
  }, [])

  return { tasks, loading, refetch: fetchTasks }
}

