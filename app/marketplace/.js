"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useSession, useDescope, useUser } from '@descope/react-sdk'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Search, Wrench as Tool, AlertCircle, DollarSign, Copy, Package } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function useTasks(onChange) {
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

      const results = await Promise.all(ids.map(async (id) => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/mcp/tasks/${id}`)
          // Treat non-2xx as removable (e.g., 404 not found)
          if (!res.ok) {
            idsToRemove.push(id)
            return null
          }
          const data = await res.json()
          if (!data?.success) {
            const msg = (data?.message || '').toLowerCase()
            if (msg.includes('not found')) {
              idsToRemove.push(id)
            } else {
              // Keep if unknown error to retry later
              idsToKeep.push(id)
            }
            return null
          }
          const task = { id, ...data.task }
          // Remove completed tasks from polling and storage
          if (task.status === 'pending' || task.status === 'running') {
            running.push(task)
            idsToKeep.push(id)
          } else {
            idsToRemove.push(id)
          }
          return task
        } catch {
          // Network/parse error: keep id to retry later
          idsToKeep.push(id)
          return null
        }
      }))

      // Update stored ids if changed
      const normalizedKeep = Array.from(new Set(idsToKeep))
      if (normalizedKeep.length !== ids.length || idsToRemove.length > 0) {
        localStorage.setItem(key, JSON.stringify(normalizedKeep))
      }

      // Only update state if statuses changed to avoid page re-render flicker
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

function useMcps() {
  const [mcps, setMcps] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchMcps = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/mcps`)
      const data = await res.json()
      if (data.success) setMcps(data.mcps)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMcps()
  }, [])

  return { mcps, loading, refetch: fetchMcps }
}

function getStatusBadge(status) {
  const common = 'text-xs px-2 py-0.5 rounded'
  if (status === 'running' || status === 'pending') return <span className={`${common} bg-blue-600/20 text-blue-400`}>Running</span>
  if (status === 'failed') return <span className={`${common} bg-red-600/20 text-red-400`}>Failed</span>
  if (status === 'succeeded') return <span className={`${common} bg-green-600/20 text-green-400`}>Live</span>
  return null
}

function MCPCard({ mcp, onClick }) {
  const tools = mcp.tools || []
  const displayedTools = tools.slice(0, 3)
  const canShowConfig = true

  const copyConfig = async (e) => {
    e?.stopPropagation?.()
    try {
      const config = mcp.config || {}
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
    } catch {}
  }

  return (
    <Card onClick={onClick} className="border-gray-600 hover:border-gray-400 transition-colors h-72 flex flex-col cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">{mcp.title || mcp.name}</CardTitle>
          {getStatusBadge(mcp.status)}
        </div>
        <CardDescription className="line-clamp-3 text-sm">
          {mcp.description || 'MCP service deployment'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {tools && tools.length > 0 ? (
          <div>
            <div className="flex items-center mb-2">
              <Tool className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium">Tools ({tools.length})</span>
            </div>
            <div className="space-y-2 max-h-24 overflow-y-auto pr-1">
              {displayedTools.map((tool, index) => (
                <div key={index} className="bg-gray-800 p-2 rounded border border-gray-700">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-primary">{tool.name}</p>
                    {tool.price > 0 ? (
                      <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded">${tool.price}</span>
                    ) : (
                      <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">Free</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {tool.description && tool.description.length > 100 ? tool.description.substring(0, 100) + '...' : tool.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : mcp.status && mcp.status !== 'succeeded' ? (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">{mcp.status === 'failed' ? 'Deployment failed' : 'Loading tools...'}</p>
            </div>
          </div>
        ) : null}

        {/* Hide environment info on cards; visible only in dialog */}
      </CardContent>

      <CardFooter className="flex-col space-y-2 pt-0">
        {/* <div className="flex w-full space-x-2">
          <Button variant="outline" size="sm" onClick={copyConfig} className="flex-1 border-gray-600 hover:border-gray-400">
            <Copy className="h-4 w-4 mr-2" />
            Copy Config
          </Button>
        </div> */}
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          {mcp.created_at ? <span>Created {new Date(mcp.created_at).toLocaleDateString()}</span> : <span />}
          {mcp.pricing > 0 && (
            <div className="flex items-center">
              <DollarSign className="h-3 w-3 mr-1" />
              <span>{mcp.pricing} USDC</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="border-gray-600">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-700 rounded w-5/6"></div>
              </div>
              <div className="h-20 bg-gray-700 rounded"></div>
              <div className="h-8 bg-gray-700 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EmptyState({ searchQuery }) {
  return (
    <div className="text-center py-12">
      <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">{searchQuery ? 'No MCPs found' : 'No MCPs available'}</h3>
      <p className="text-muted-foreground">
        {searchQuery ? "Try adjusting your search terms to find what you're looking for." : 'Be the first to create and share an MCP!'}
      </p>
    </div>
  )
}

export default function MarketplacePage() {
  const { isAuthenticated, isSessionLoading } = useSession()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const { getSessionToken } = useDescope()

  const [searchQuery, setSearchQuery] = useState('')
  const { mcps, loading: mcpsLoading, refetch: refetchMcps } = useMcps()
  const { tasks, loading: tasksLoading, refetch: refetchTasks } = useTasks(({ removedIds }) => {
    if (removedIds && removedIds.length) {
      // When a task completes (removed), refresh MCPs so new records appear
      refetchMcps()
    }
  })
  
  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isSessionLoading, router])

  const runningItems = useMemo(() => {
    return tasks
      .filter(t => t.status === 'pending' || t.status === 'running')
      .map(t => {
        const resultTools = (t.result && t.result.tools) || []
        const envVars = (t.input && t.input.mcpEnvNames) ? Object.fromEntries((t.input.mcpEnvNames || []).map(k => [k, ''])) : undefined
        const visibility = (t.input && t.input.isPrivate) ? 'private' : 'public'
        return {
          id: t.id,
          name: t.input?.name || t.input?.mcpCommand || 'MCP',
          description: t.progress ? `Progress: ${t.progress}` : 'Validating and deploying MCP...',
          tools: resultTools,
          environment_variables: envVars,
          status: t.status,
          config: {
            command: t.input?.mcpCommand,
            args: t.input?.mcpArgs || [],
            env: envVars,
            metadata: { visibility }
          },
          created_at: t.created_at
        }
      })
  }, [tasks])

  const dbItems = useMemo(() => {
    // Merge DB mcps with any completed task tool metadata if present
    return mcps.map(m => {
      return {
        ...m,
        status: 'succeeded',
        tools: (m.config && m.config.tools) || [],
        environment_variables: (m.config && m.config.env) || undefined,
      }
    })
  }, [mcps])

  const filterByQuery = (items) => {
    if (!searchQuery.trim()) return items
    const q = searchQuery.toLowerCase()
    return items.filter(m => {
      const name = (m.name || '').toLowerCase()
      const desc = (m.description || '').toLowerCase()
      const tools = (m.tools || []).map(t => (t.name || '').toLowerCase()).join(' ')
      return name.includes(q) || desc.includes(q) || tools.includes(q)
    })
  }

  const userId = user?.userId || user?.sub || user?.id || user?.user_id
  const publicMcps = filterByQuery(dbItems.filter(m => (m.config?.metadata?.visibility || 'public') === 'public' && !(m.user_id && userId && m.user_id === userId)))
  const ownedMcps = filterByQuery(dbItems.filter(m => m.user_id && userId && m.user_id === userId))
  const privateMcps = filterByQuery(dbItems.filter(m => m.config?.metadata?.visibility === 'private'))
  const runningMcps = filterByQuery(runningItems)

  const isLoading = mcpsLoading || tasksLoading

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMcp, setSelectedMcp] = useState(null)
  const [clientEnv, setClientEnv] = useState({})
  const [generalEnv, setGeneralEnv] = useState({})
  const [savingClientEnv, setSavingClientEnv] = useState(false)
  const [updatingVisibility, setUpdatingVisibility] = useState(false)

  const openDetails = async (m) => {
    setSelectedMcp(m)
    setDialogOpen(true)
    setClientEnv({})
    // Initialize general env from MCP config for owner display
    const genNames = m?.config?.metadata?.general_env_names || []
    const baseEnv = (m?.config?.env) || {}
    const genInit = {}
    genNames.forEach(k => { genInit[k] = baseEnv[k] ?? '' })
    setGeneralEnv(genInit)
    try {
      if (m?.id && userId) {
        const token = getSessionToken()
        const res = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/client-mcps/${m.id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
        const data = await res.json()
        if (data?.success && data?.client_mcp) {
          setClientEnv(data.client_mcp.mcp_env_variables || {})
        } else {
          setClientEnv({})
        }
      }
    } catch (e) {
      setClientEnv({})
    }
  }

  const saveEnvs = async () => {
    if (!selectedMcp?.id) return
    setSavingClientEnv(true)
    try {
      const token = getSessionToken()
      // Save per-user MCP env (available to all users)
      const res = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/client-mcps/${selectedMcp.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ env_variables: clientEnv || {} })
      })
      const data = await res.json()
      if (!data?.success) throw new Error(data?.message || 'Failed to save')

      // If owner, also persist general env into MCP config
      if (isOwned(selectedMcp)) {
        const res2 = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/mcps/${selectedMcp.id}/env`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ env: generalEnv || {} })
        })
        const data2 = await res2.json()
        if (!data2?.success) throw new Error(data2?.message || 'Failed to update MCP env')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSavingClientEnv(false)
    }
  }

  const toggleVisibility = async () => {
    if (!selectedMcp?.id) return
    try {
      setUpdatingVisibility(true)
      const token = getSessionToken()
      const current = selectedMcp?.config?.metadata?.visibility || 'public'
      const next = current === 'public' ? 'private' : 'public'
      const res = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/mcps/${selectedMcp.id}/visibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ visibility: next })
      })
      const data = await res.json()
      if (!data?.success) throw new Error(data?.message || 'Failed to update visibility')
      // Update local state
      setSelectedMcp(prev => ({
        ...prev,
        config: {
          ...(prev?.config || {}),
          metadata: { ...(prev?.config?.metadata || {}), visibility: next }
        }
      }))
      // Refresh lists so public/owned sections update
      refetchMcps()
    } catch (e) {
      console.error(e)
    } finally {
      setUpdatingVisibility(false)
    }
  }

  const isOwned = (m) => !!(m?.user_id && userId && m.user_id === userId)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">MCP Marketplace</h1>
          <p className="text-muted-foreground">Discover and integrate Modular Compute Protocol tools into your applications</p>
        </div>

        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search MCPs, tools, or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-600"
            />
          </div>
        </div>

        {!isLoading && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? (
                <>Found {publicMcps.length + privateMcps.length + runningMcps.length} MCP{(publicMcps.length + privateMcps.length + runningMcps.length) !== 1 ? 's' : ''} for {searchQuery}</>
              ) : (
                <>{dbItems.length} MCP{dbItems.length !== 1 ? 's' : ''} available</>
              )}
            </p>
          </div>
        )}

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-10">
            {runningMcps.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Running</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {runningMcps.map((m) => <MCPCard key={m.id} mcp={m} onClick={() => openDetails(m)} />)}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-xl font-semibold mb-4">Public MCPs</h2>
              {publicMcps.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publicMcps.map((m) => <MCPCard key={m.id} mcp={m} onClick={() => openDetails(m)} />)}
                </div>
              ) : (
                <EmptyState searchQuery={searchQuery} />
              )}
            </section>

            {ownedMcps.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Owned MCPs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ownedMcps.map((m) => <MCPCard key={m.id} mcp={m} onClick={() => openDetails(m)} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedMcp?.title || selectedMcp?.name}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {isOwned(selectedMcp) && (
              <div className="flex items-center justify-between border border-gray-800 rounded p-3">
                <div>
                  <div className="text-sm font-medium">Visibility</div>
                  <div className="text-xs text-muted-foreground">{(selectedMcp?.config?.metadata?.visibility || 'public') === 'public' ? 'Public' : 'Private'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">Private</span>
                  <Switch
                    checked={(selectedMcp?.config?.metadata?.visibility || 'public') === 'public'}
                    onCheckedChange={toggleVisibility}
                    disabled={updatingVisibility}
                  />
                  <span className="text-xs">Public</span>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">{selectedMcp?.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Tools</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(selectedMcp?.tools || []).map((t, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-700 rounded p-3">
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-3">{t.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Env section */}
            <div>
              <h3 className="text-sm font-medium mb-2">Environment</h3>
              {/* Merge both env groups in one section but separated */}
              <div className="space-y-4">
                {/* MCP Env names (always shown) */}
                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-1">MCP Env</div>
                  <div className="space-y-2">
                    {(selectedMcp?.config?.mcp_env_names || []).map((k) => (
                      <div key={k} className="flex items-center gap-2">
                        <span className="text-xs w-48 truncate">{k}</span>
                        <Input
                          value={clientEnv?.[k] ?? ''}
                          onChange={(e) => setClientEnv(prev => ({ ...(prev || {}), [k]: e.target.value }))}
                          placeholder="value"
                          className="flex-1"
                        />
                      </div>
                    ))}
                    {(!selectedMcp?.config?.mcp_env_names || selectedMcp?.config?.mcp_env_names.length === 0) && (
                      <div className="text-xs text-muted-foreground">No MCP env defined.</div>
                    )}
                  </div>
                </div>

                {/* General env names (owned only) */}
                {isOwned(selectedMcp) && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">General Env</div>
                    <div className="space-y-2">
                      {(selectedMcp?.config?.metadata?.general_env_names || []).map((k) => (
                        <div key={k} className="flex items-center gap-2">
                          <span className="text-xs w-48 truncate">{k}</span>
                          <Input
                            value={generalEnv?.[k] ?? ''}
                            onChange={(e) => setGeneralEnv(prev => ({ ...(prev || {}), [k]: e.target.value }))}
                            placeholder="value"
                            className="flex-1"
                          />
                        </div>
                      ))}
                      {(!selectedMcp?.config?.metadata?.general_env_names || selectedMcp?.config?.metadata?.general_env_names.length === 0) && (
                        <div className="text-xs text-muted-foreground">No general env defined.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t bg-background">
            <Button onClick={saveEnvs} disabled={savingClientEnv}>
              {savingClientEnv ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
