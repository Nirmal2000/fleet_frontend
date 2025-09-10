import { Button } from '@/components/ui/button'
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/ui/prompt-input'
import { Globe, Mic, MoreHorizontal, Plus, ArrowUp, SquareAsterisk } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import MCPDetailsDialog from '@/components/marketplace/MCPDetailsDialog'
import { useMcps } from '@/hooks/useMcps'
import { useOutboundApps } from '@/hooks/useOutboundApps'
import { useDescope, useUser } from '@descope/react-sdk'
import { useMemo, useState } from 'react'
import { Switch } from '@/components/ui/switch'

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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMcp, setSelectedMcp] = useState(null)

  const marketplaceItems = useMemo(() => {
    const items = mcps || []
    const userId = user?.userId || user?.sub || user?.id || user?.user_id
    return items.filter((m) => {
      const vis = (m?.config?.metadata?.visibility || 'public')
      const owner = m?.user_id && userId && m.user_id === userId
      return vis === 'public' || owner
    })
  }, [mcps, user])

  const openMcpDetails = (m) => {
    setSelectedMcp(m)
    setDialogOpen(true)
  }

  const handleConnectIntegration = async (app) => {
    if (!app?.id) return
    try {
      // Initiate Descope outbound OAuth flow; tokens are stored server-side by Descope.
      // Assumption: app.id is the outbound app ID and app.name is display name.
      const token = await getSessionToken()?.catch?.(() => null)
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
    <div className="mt-4">
      <PromptInput
        isLoading={loading}
        value={inputMessage}
        onValueChange={setInputMessage}
        onSubmit={onSendMessage}
        className="border-input bg-popover relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-xs"
        disabled={!sandboxCreated}
      >
        <div className="flex flex-col">
          <PromptInputTextarea
            placeholder="Ask anything"
            className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base"
          />

          <PromptInputActions className="mt-5 flex w-full items-center justify-between gap-2 px-3 pb-3">
            <div className="flex items-center gap-2">
              <PromptInputAction tooltip="Add a new action">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-full"
                >
                  <Plus size={18} />
                </Button>
              </PromptInputAction>

              <PromptInputAction tooltip="Add MCP to this chat">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      disabled={!sandboxCreated}
                    >
                      <SquareAsterisk size={18} className="mr-2" />
                      Add MCP
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 max-h-80">
                    {marketplaceItems.length === 0 ? (
                      <DropdownMenuItem disabled>No MCPs found</DropdownMenuItem>
                    ) : (
                      marketplaceItems.map((m) => (
                        <DropdownMenuItem
                          key={m.id}
                          className="cursor-pointer"
                          onClick={() => openMcpDetails(m)}
                        >
                          {m.title || m.name}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </PromptInputAction>

              <PromptInputAction tooltip="Add Integration to this chat">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      disabled={!sandboxCreated}
                    >
                      <SquareAsterisk size={18} className="mr-2" />
                      Add Integration
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 max-h-80">
                    {(integrations || []).length === 0 ? (
                      <DropdownMenuItem disabled>No integrations found</DropdownMenuItem>
                    ) : (
                      (integrations || []).map((it) => (
                        <DropdownMenuItem
                          key={it.id || it.name}
                          className="cursor-pointer group flex items-center"
                          onSelect={(e) => { e.preventDefault(); if (!it.connected) handleConnectIntegration(it) }}
                        >
                          <span className="truncate">{it.name}</span>
                          <span className="ml-auto flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!it.connected && (
                              <button
                                className="text-xs text-primary underline"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleConnectIntegration(it) }}
                              >
                                Connect
                              </button>
                            )}
                            <Switch
                              disabled={!it.connected || !sandboxCreated}
                              onCheckedChange={(checked) => handleToggleIntegration(it, checked)}
                            />
                          </span>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </PromptInputAction>

              <PromptInputAction tooltip="Search">
                <Button variant="outline" className="rounded-full">
                  <Globe size={18} />
                  Search
                </Button>
              </PromptInputAction>

              <PromptInputAction tooltip="More actions">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-full"
                >
                  <MoreHorizontal size={18} />
                </Button>
              </PromptInputAction>
            </div>
            <div className="flex items-center gap-2">
              <PromptInputAction tooltip="Voice input">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-full"
                >
                  <Mic size={18} />
                </Button>
              </PromptInputAction>

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

      <MCPDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mcp={selectedMcp}
        isOwner={false}
        getSessionToken={getSessionToken}
        onSaved={() => { /* no-op here */ }}
        chatId={chatId}
      />
    </div>
  )
}
