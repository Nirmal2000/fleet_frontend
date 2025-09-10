"use client"

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { beginInboundLogin } from '@/lib/inboundAuth'

export default function MCPDetailsDialog({
  open,
  onOpenChange,
  mcp,
  isOwner,
  getSessionToken,
  onSaved,
  chatId,
}) {
  function maskValue(val, visible = 4) {
    const s = String(val || '')
    if (s.length <= visible) return s
    return s.slice(0, visible) + '*'.repeat(s.length - visible)
  }
  const [clientEnv, setClientEnv] = useState({})
  const [generalEnv, setGeneralEnv] = useState({})
  const [saving, setSaving] = useState(false)
  const [updatingVisibility, setUpdatingVisibility] = useState(false)
  const [roles, setRoles] = useState([])
  const [toolRoles, setToolRoles] = useState({})
  const [toggling, setToggling] = useState(false)

  // Initialize env states on open/mcp change
  useEffect(() => {
    if (!open || !mcp) return
    const genNames = mcp?.config?.metadata?.general_env_names || []
    const baseEnv = mcp?.config?.env || {}
    const genInit = {}
    genNames.forEach(k => { genInit[k] = baseEnv[k] ?? '' })
    setGeneralEnv(genInit)
    setClientEnv({})
    // Initialize tool roles
    const tr = mcp?.config?.metadata?.tool_roles || {}
    setToolRoles(tr)

    // Fetch per-user saved envs
    ;(async () => {
      try {
        if (mcp?.id && getSessionToken) {
          const token = await getSessionToken()
          const res = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/client-mcps/${mcp.id}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          })
          const data = await res.json()
          if (data?.success && data?.client_mcp) {
            setClientEnv(data.client_mcp.mcp_env_variables || {})
          }
        }
      } catch {}
    })()
    // Fetch available Descope roles for dropdown
    ;(async () => {
      try {
        const token = await getSessionToken?.()
        const res = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/descope/roles`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
        const data = await res.json()
        if (data?.success) setRoles(data.roles || [])
      } catch {}
    })()
  }, [open, mcp, getSessionToken])

  const saveEnvs = async () => {
    if (!mcp?.id) return
    setSaving(true)
    try {
      const token = await getSessionToken()
      // Save per-user env
      const res = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/client-mcps/${mcp.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ env_variables: clientEnv || {} })
      })
      const data = await res.json()
      if (!data?.success) throw new Error(data?.message || 'Failed to save')

      // Owner updates general env on MCP
      if (isOwner) {
        const res2 = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/mcps/${mcp.id}/env`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ env: generalEnv || {} })
        })
        const data2 = await res2.json()
        if (!data2?.success) throw new Error(data2?.message || 'Failed to update MCP env')
        // Also update tool role selections if changed
        const current = mcp?.config?.metadata?.tool_roles || {}
        const changed = {}
        Object.keys(toolRoles || {}).forEach((k) => {
          if ((toolRoles?.[k] || '') !== (current?.[k] || '')) {
            changed[k] = toolRoles[k]
          }
        })
        if (Object.keys(changed).length > 0) {
          const res3 = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/mcps/${mcp.id}/tool-roles`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ roles: changed })
          })
          const data3 = await res3.json()
          if (!data3?.success) throw new Error(data3?.message || 'Failed to update tool roles')
        }
      }
      onSaved?.()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const toggleVisibility = async () => {
    if (!mcp?.id) return
    try {
      setUpdatingVisibility(true)
      const token = await getSessionToken()
      const current = mcp?.config?.metadata?.visibility || 'public'
      const next = current === 'public' ? 'private' : 'public'
      const res = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/mcps/${mcp.id}/visibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ visibility: next })
      })
      const data = await res.json()
      if (!data?.success) throw new Error(data?.message || 'Failed to update visibility')
      onSaved?.()
    } catch (e) {
      console.error(e)
    } finally {
      setUpdatingVisibility(false)
    }
  }

  const enableForChat = async () => {
    if (!mcp?.id || !chatId) return
    try {
      setToggling(true)
      const token = getSessionToken?.()
      const res = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/chat/${chatId}/toggle-mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include', // include inbound cookie if present
        body: JSON.stringify({ mcp_id: mcp.id, enabled: true })
      })
      const data = await res.json().catch(() => ({}))
      console.log('Toggle MCP response', res.status, data)
      if (!res.ok || !data?.success) {
        // If backend indicates inbound auth is required, start the flow
        if (data?.inbound_required) {
          try {
            // Fetch per-MCP inbound clientId
            const cfgRes = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/mcps/${mcp.id}/inbound-config`)            
            const cfg = await cfgRes.json().catch(() => ({}))
            console.log('Inbound config response', cfg)
            const clientId = cfg?.clientId
            await beginInboundLogin({ mcpId: mcp.id, chatId, clientId, scopes: [] })
          } catch {
            await beginInboundLogin({ mcpId: mcp.id, chatId, scopes: [] })
          }
          return
        }
        throw new Error(data?.message || `Failed to enable MCP (${res.status})`)
      }
      onSaved?.()
      onOpenChange?.(false)
    } catch (e) {
      console.error(e)
    } finally {
      setToggling(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{mcp?.title || mcp?.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {isOwner && (
            <div className="flex items-center justify-between border border-gray-800 rounded p-3">
              <div>
                <div className="text-sm font-medium">Visibility</div>
                <div className="text-xs text-muted-foreground">{(mcp?.config?.metadata?.visibility || 'public') === 'public' ? 'Public' : 'Private'}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">Private</span>
                <Switch
                  checked={(mcp?.config?.metadata?.visibility || 'public') === 'public'}
                  onCheckedChange={toggleVisibility}
                  disabled={updatingVisibility}
                />
                <span className="text-xs">Public</span>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium mb-2">Tools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(mcp?.tools || []).map((t, i) => {
                const roleValue = toolRoles?.[t.name] || ''
                return (
                  <div key={i} className="bg-gray-900 border border-gray-700 rounded p-3 space-y-2">
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-3">{t.description}</div>
                    {isOwner && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Role</span>
                        <select
                          className="bg-transparent border border-gray-700 rounded px-2 py-1 text-xs flex-1"
                          value={roleValue}
                          onChange={(e) => setToolRoles((prev) => ({ ...(prev || {}), [t.name]: e.target.value }))}
                        >
                          <option value="">Select role</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.name}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Environment</h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs uppercase text-muted-foreground mb-1">MCP Env</div>
                <div className="space-y-2">
                  {(mcp?.config?.mcp_env_names || []).map((k) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-xs w-48 truncate">{k}</span>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        value={clientEnv?.[k] ?? ''}
                        onChange={(e) => setClientEnv(prev => ({ ...(prev || {}), [k]: e.target.value }))}
                        placeholder="value"
                        className="flex-1"
                      />
                      <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[160px]">
                        {maskValue(clientEnv?.[k] ?? '')}
                      </span>
                    </div>
                  ))}
                  {(!mcp?.config?.mcp_env_names || mcp?.config?.mcp_env_names.length === 0) && (
                    <div className="text-xs text-muted-foreground">No MCP env defined.</div>
                  )}
                </div>
              </div>

              {isOwner && (
                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-1">General Env</div>
                  <div className="space-y-2">
                    {(mcp?.config?.metadata?.general_env_names || []).map((k) => (
                      <div key={k} className="flex items-center gap-2">
                        <span className="text-xs w-48 truncate">{k}</span>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          value={generalEnv?.[k] ?? ''}
                          onChange={(e) => setGeneralEnv(prev => ({ ...(prev || {}), [k]: e.target.value }))}
                          placeholder="value"
                          className="flex-1"
                        />
                        <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[160px]">
                          {maskValue(generalEnv?.[k] ?? '')}
                        </span>
                      </div>
                    ))}
                    {(!mcp?.config?.metadata?.general_env_names || mcp?.config?.metadata?.general_env_names.length === 0) && (
                      <div className="text-xs text-muted-foreground">No general env defined.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t bg-background">
          {chatId && (
            <Button variant="secondary" onClick={enableForChat} disabled={toggling}>
              {toggling ? 'Enabling…' : 'Enable for this chat'}
            </Button>
          )}
          <Button onClick={saveEnvs} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
