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
import { useDescope, useUser } from '@descope/react-sdk'
import { useMemo, useState } from 'react'

export function ChatInput({
  inputMessage,
  setInputMessage,
  loading,
  sandboxCreated,
  onSendMessage,
  chatId,
}) {
  const { mcps } = useMcps()
  const { getSessionToken } = useDescope()
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
