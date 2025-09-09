"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useSession, useDescope, useUser } from '@descope/react-sdk'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Package } from 'lucide-react'
import MCPCard from '@/components/marketplace/MCPCard'
import MCPDetailsDialog from '@/components/marketplace/MCPDetailsDialog'
import { useMcps } from '@/hooks/useMcps'
import { useMcpTasks } from '@/hooks/useMcpTasks'

// moved to '@/hooks/useMcpTasks'

// moved to '@/hooks/useMcps'

// status badge is handled inside MCPCard

// MCPCard now imported from '@/components/marketplace/MCPCard'

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
  console.log("User:", user)
  const router = useRouter()
  const { getSessionToken } = useDescope()

  const [searchQuery, setSearchQuery] = useState('')
  const { mcps, loading: mcpsLoading, refetch: refetchMcps } = useMcps()
  const { tasks, loading: tasksLoading, refetch: refetchTasks } = useMcpTasks(({ removedIds }) => {
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
  const openDetails = (m) => {
    setSelectedMcp(m)
    setDialogOpen(true)
  }

  // Keep selected MCP in sync with latest data after refetches (e.g., visibility toggle)
  useEffect(() => {
    if (!dialogOpen || !selectedMcp?.id) return
    const fresh = dbItems.find((m) => m.id === selectedMcp.id)
    if (fresh) setSelectedMcp(fresh)
  }, [dbItems, dialogOpen, selectedMcp?.id])

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

      <MCPDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mcp={selectedMcp}
        isOwner={isOwned(selectedMcp)}
        getSessionToken={getSessionToken}
        onSaved={() => { refetchMcps() }}
      />
    </div>
  )
}
