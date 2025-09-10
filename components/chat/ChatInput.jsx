import { Button } from '@/components/ui/button'
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/ui/prompt-input'
import { Globe, Mic, MoreHorizontal, Plus, ArrowUp, SquareAsterisk, Wrench } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
// MCPDetailsDialog intentionally not used per requirements
import { useMcps } from '@/hooks/useMcps'
import { useOutboundApps } from '@/hooks/useOutboundApps'
import { useDescope, useUser } from '@descope/react-sdk'
import { useMemo, useState } from 'react'
import { beginInboundLogin } from '@/lib/inboundAuth'
import { Switch } from '@/components/ui/switch'
import AddToolsCard from '@/components/chat/AddToolsCard'

export function ChatInput({
  inputMessage,
  setInputMessage,
  loading,
  sandboxCreated,
  onSendMessage,
  chatId,
}) {
  const { mcps } = useMcps()  
  const { getSessionToken, outbound } = useDescope()  
  const { integrations, refetch: refetchIntegrations } = useOutboundApps(getSessionToken)
  const { user } = useUser()
  // Removed MCPDetailsDialog usage
  const [toolsOpen, setToolsOpen] = useState(false)

  const marketplaceItems = useMemo(() => {
    const items = mcps || []
    const userId = user?.userId || user?.sub || user?.id || user?.user_id
    return items.filter((m) => {
      const vis = (m?.config?.metadata?.visibility || 'public')
      const owner = m?.user_id && userId && m.user_id === userId
      return vis === 'public' || owner
    })
  }, [mcps, user])

  const connectMcpInbound = async (m) => {
    try {
      // Fetch per-MCP inbound clientId if available, fallback to default
      let clientId
      try {
        const cfgRes = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/mcps/${m.id}/inbound-config`)
        const cfg = await cfgRes.json().catch(() => ({}))
        clientId = cfg?.clientId
      } catch {}
      await beginInboundLogin({ mcpId: m.id, chatId, clientId, scopes: [] })
    } catch (e) {
      console.warn('Inbound login failed', e)
    }
  }

  const handleConnectIntegration = async (app) => {
    if (!app?.id) return
    try {
      // Initiate Descope outbound OAuth flow; tokens are stored server-side by Descope.
      // Assumption: app.id is the outbound app ID and app.name is display name.
      const token = getSessionToken()
      const resp = await outbound.connect(
        app.id,
        {
          // Must be camelCase: redirectUrl
          redirectUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        },
        token || undefined
      )
      const url = (resp && (resp.data?.url || resp.url)) || null
      if (url) {
        window.location.assign(url)
        return
      }
      // Fallback: refresh connection status if no redirect happened
      try { await refetchIntegrations?.() } catch (_) {}
    } catch (error) {
      console.error('Error connecting to outbound app', app?.id, error)
    }
  }

  const handleToggleIntegration = async (app, enabled) => {
    try {
      const token = getSessionToken()
      console.log(token)
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/chat/${encodeURIComponent(chatId)}/integrations/gmail/toggle`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ enabled: !!enabled, app_id: app?.id || app?.raw?.id, tenant_id: undefined }),
        }
      )
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.warn('Failed to toggle Gmail integration', res.status, body)
      }
    } catch (e) {
      console.warn('Error toggling Gmail integration', e)
    }
  }

  return (
    <div className="mt-4 mb-4 md:mb-6 mx-auto w-full max-w-3xl px-3 md:px-5">
      <PromptInput
        isLoading={loading}
        value={inputMessage}
        onValueChange={setInputMessage}
        onSubmit={onSendMessage}
        className="border-input chat-solid-bg chat-solid-border relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-xs"
        disabled={!sandboxCreated}
      >
        <div className="flex flex-col">
          <PromptInputTextarea
            placeholder="Ask anything"
            className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base"
          />

          <PromptInputActions className="mt-5 flex w-full items-center justify-between gap-2 px-3 pb-3">
            <div className="flex items-center gap-2">
              <PromptInputAction tooltip="Add tools">
                <Button
                  variant="outline"
                  className="rounded-full btn-chat-primary"
                  disabled={!sandboxCreated}
                  onClick={() => setToolsOpen(true)}
                >
                  <Wrench size={18} className="mr-2" />
                  Add tools
                </Button>
              </PromptInputAction>

              {/* <PromptInputAction tooltip="Search">
                <Button variant="outline" className="rounded-full">
                  <Globe size={18} />
                  Search
                </Button>
              </PromptInputAction> */}

              {/* <PromptInputAction tooltip="More actions">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-full"
                >
                  <MoreHorizontal size={18} />
                </Button>
              </PromptInputAction> */}
            </div>
            <div className="flex items-center gap-2">              

              <Button
                size="icon"
                disabled={!inputMessage.trim() || loading || !sandboxCreated}
                onClick={onSendMessage}
                className="size-9 rounded-full"
              >
                {!loading ? (
                  <ArrowUp size={18} />
                ) : (
                  <span className="size-3 rounded-xs bg-white" />
                )}
              </Button>
            </div>
          </PromptInputActions>
        </div>
      </PromptInput>

      {/* Narrow tools picker card */}
      <AddToolsCard
        open={toolsOpen}
        onOpenChange={setToolsOpen}
        mcps={marketplaceItems}
        integrations={integrations}
        onConnectMcp={(m) => connectMcpInbound(m)}
        onToggleMcp={async (m, enabled) => {
          if (!m?.id || !chatId) return
          try {
            const token = getSessionToken()
            const res = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/chat/${encodeURIComponent(chatId)}/toggle-mcp`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              credentials: 'include',
              body: JSON.stringify({ mcp_id: m.id, enabled: !!enabled })
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok || !data?.success) {
              // await connectMcpInbound(m)
            }
          } catch (e) {
            await connectMcpInbound(m)
          }
        }}
        onConnectIntegration={(it) => handleConnectIntegration(it)}
        onToggleIntegration={(it, checked) => handleToggleIntegration(it, checked)}
        onSaveMcpEnv={async (m, key, value) => {
          try {
            const token = getSessionToken()
            await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/client-mcps/${m.id}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ env_variables: { [key]: value } })
            })
          } catch (e) {
            console.warn('Failed saving MCP env', e)
          }
        }}
      />
      {/* MCPDetailsDialog intentionally removed */}
    </div>
  )
}
