"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ChevronRight } from "lucide-react"

function EnvRow({ name, onSave, showDivider }) {
  const [val, setVal] = useState("")
  return (
    <div className="py-2">
      <div className="flex items-center gap-1">
        <div className="text-xs text-muted-foreground w-32 truncate">{name}</div>
        <input
          type="password"
          className="flex-1 bg-transparent border border-[#1b1d1f] rounded px-2 py-1 text-sm"
          placeholder="value"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <Button
          variant="outline"
          className="h-7 px-2 fleet-surface text-white border-transparent"
          onClick={() => onSave?.(val)}
        >
          ✓
        </Button>
      </div>
      {showDivider && <div className="mx-12 my-2 h-px w-1/2 bg-[#1b1d1f]" />}
    </div>
  )
}

export default function AddToolsCard({
  open,
  onOpenChange,
  mcps = [],
  integrations = [],
  onConnectMcp,
  onToggleMcp,
  onConnectIntegration,
  onToggleIntegration,
  onSaveMcpEnv,
}) {
  const [tab, setTab] = useState("mcp")
  const [expanded, setExpanded] = useState({})

  const toggleExpand = (id) => setExpanded((s) => ({ ...s, [id]: !s[id] }))

  const orderedMcps = useMemo(() => mcps || [], [mcps])
  const orderedIntegrations = useMemo(() => integrations || [], [integrations])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border chat-border bg-[#1a1c1e] border-[#1b1d1f] rounded-xl max-w-md h-[480px]">
        <DialogHeader className="px-3 pt-3 pb-0">
          <DialogTitle className="text-sm text-white">Add tools</DialogTitle>
        </DialogHeader>
        <div className="p-3 h-[430px] flex flex-col">
          <Tabs value={tab} onValueChange={setTab} className="gap-3">
            <TabsList className="bg-[#1a1c1e] text-muted-foreground w-full justify-start p-0 gap-2">
              <TabsTrigger
                value="mcp"
                className={`px-3 py-1.5 ${tab === "mcp" ? "text-white" : "text-muted-foreground"} bg-[#1a1c1e] border border-[#1b1d1f]`}
              >
                MCP
              </TabsTrigger>
              <TabsTrigger
                value="integration"
                className={`px-3 py-1.5 ${tab === "integration" ? "text-white" : "text-muted-foreground"} bg-[#1a1c1e] border border-[#1b1d1f]`}
              >
                Integration
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mcp" className="mt-3 flex-1 overflow-auto">
              <div className="flex flex-col gap-2">
                {orderedMcps.map((m) => {
                  const id = m.id || m.name
                  const isOpen = !!expanded[id]
                  const mcpEnvNames = (m?.config?.mcp_env_names) || []
                  const name = m.title || m.name || "MCP"
                  const desc = m.description || ""
                  return (
                    <div key={id} className="rounded-lg border border-[#1b1d1f]">
                      <div className="flex items-center gap-2 px-3 py-2 hover:bg-[#1b1d1f]/30 transition-colors">
                        <button
                          aria-label={isOpen ? "Collapse" : "Expand"}
                          onClick={() => toggleExpand(id)}
                          className={`shrink-0 rounded-sm p-1 text-muted-foreground hover:text-white transition-colors ${isOpen ? "rotate-90" : ""}`}
                        >
                          <ChevronRight className="size-4" />
                        </button>
                        <div className="flex-1 truncate text-sm text-foreground">
                          <span className="truncate">
                            {name}
                            {desc ? ` — ${desc}` : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" className="h-7 px-2 fleet-surface text-white border-transparent" onClick={() => onConnectMcp?.(m)}>
                            Connect
                          </Button>
                          <Switch onCheckedChange={(v) => onToggleMcp?.(m, v)} />
                        </div>
                      </div>
                      {isOpen && (
                        <div className="max-h-72 overflow-auto px-3 pb-3">
                          {(mcpEnvNames || []).length === 0 ? (
                            <div className="text-xs text-muted-foreground py-2">No MCP env defined.</div>
                          ) : (
                            mcpEnvNames.map((k, i) => (
                              <EnvRow key={k} name={k} onSave={(val) => onSaveMcpEnv?.(m, k, val)} showDivider={i < mcpEnvNames.length - 1} />
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="integration" className="mt-3 flex-1 overflow-auto">
              <div className="flex flex-col gap-2">
                {orderedIntegrations.map((it) => (
                  <div key={it.id || it.name} className="flex items-center justify-between rounded-lg border border-[#1b1d1f] px-3 py-2">
                    <div className="truncate text-sm">{it.name}</div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="h-7 px-2 fleet-surface text-white border-transparent"
                        onClick={() => onConnectIntegration?.(it)}
                      >
                        Connect
                      </Button>
                      <Switch onCheckedChange={(v) => onToggleIntegration?.(it, v)} />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
