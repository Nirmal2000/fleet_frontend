"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import MCPConfigDialog from '@/components/MCPConfigDialog'
import MCPCard from '@/components/MCPCard'
import ActiveMCPsList from '@/components/ActiveMCPsList'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Plus, AlertTriangle, RefreshCw } from 'lucide-react'

export default function MCPManager({ enabledMcps, setEnabledMcps, sandboxCreated, chatId, session, onReconnect }) {
  const [loading, setLoading] = useState({})
  const [availableMcps, setAvailableMcps] = useState([])
  const [loadingMcps, setLoadingMcps] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState('create') // 'create' or 'configure'
  const [selectedMcp, setSelectedMcp] = useState(null)
  const [sandboxError, setSandboxError] = useState(null)

  useEffect(() => {
    loadAvailableMcps()
  }, [])

  const loadAvailableMcps = async () => {
    try {
      setLoadingMcps(true)
      const { data: { session: userSession } } = await supabase.auth.getSession()
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/mcps`, {
        headers: userSession?.access_token ? {
          'Authorization': `Bearer ${userSession.access_token}`
        } : {}
      })
      const data = await response.json()
      
      if (data.success) {
        setAvailableMcps(data.mcps)
      }
    } catch (error) {
      console.error('Error loading MCPs:', error)
      alert('Failed to load MCPs: ' + (error.message || 'Network error'))
    } finally {
      setLoadingMcps(false)
    }
  }

  const handleCreateMcp = () => {
    setDialogMode('create')
    setSelectedMcp(null)
    setDialogOpen(true)
  }

  const handleConfigureMcp = (mcp) => {
    setDialogMode('configure')
    setSelectedMcp(mcp)
    setDialogOpen(true)
  }

  const handleDialogSuccess = async (mcpConfig = null) => {
    if (dialogMode === 'create') {
      // Reload available MCPs after creation
      await loadAvailableMcps()
    } else if (dialogMode === 'configure' && mcpConfig) {
      // Handle MCP configuration/activation
      await activateMcp(mcpConfig)
    }
  }

  const activateMcp = async (mcpConfig) => {
    setLoading(prev => ({ ...prev, [mcpConfig.name]: true }))

    try {
      if (sandboxCreated) {
        // Get sandbox URL and send MCP toggle request
        const deviceId = localStorage.getItem('device_id')
        const sandboxResponse = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/sandbox/${chatId}?user_id=${session.user.id}`, {
          headers: {
            'X-Device-ID': deviceId
          }
        })
        
        const sandboxData = await sandboxResponse.json()
        
        if (!sandboxData.success) {
          if (sandboxData.message === 'No active sandbox found') {
            setSandboxError('Sandbox connection lost. Please reconnect.')
          }
          throw new Error(sandboxData.message || 'Failed to get sandbox info')
        }
        
        if (sandboxData.success && sandboxData.sandbox) {
          // Send MCP toggle to orchestrator (which forwards to sandbox and updates session)
          const toggleResponse = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/chat/${chatId}/toggle-mcp`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Device-ID': deviceId,
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({
              mcp_name: mcpConfig.name,
              enabled: true,
              config: mcpConfig.config,
              user_id: session.user.id
            })
          })
          
          const toggleData = await toggleResponse.json()
          if (!toggleData.success) {
            if (toggleData.message === 'No active sandbox found') {
              setSandboxError('Sandbox connection lost. Please reconnect.')
            }
            throw new Error(toggleData.message || 'Failed to toggle MCP')
          }
        }
      }

      // Add MCP to enabled list
      setEnabledMcps(prev => [
        ...prev.filter(m => m.name !== mcpConfig.name),
        mcpConfig
      ])
    } catch (error) {
      console.error('Error activating MCP:', error)
    } finally {
      setLoading(prev => ({ ...prev, [mcpConfig.name]: false }))
    }
  }


  const toggleMcp = async (mcp, enabled) => {
    setLoading(prev => ({ ...prev, [mcp.name]: true }))

    try {
      if (sandboxCreated) {
        // Get sandbox URL and send MCP toggle request
        const deviceId = localStorage.getItem('device_id')
        const sandboxResponse = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/sandbox/${chatId}?user_id=${session.user.id}`, {
          headers: {
            'X-Device-ID': deviceId
          }
        })
        
        const sandboxData = await sandboxResponse.json()
        
        if (!sandboxData.success) {
          if (sandboxData.message === 'No active sandbox found') {
            setSandboxError('Sandbox connection lost. Please reconnect.')
          }
          throw new Error(sandboxData.message || 'Failed to get sandbox info')
        }
        
        if (sandboxData.success && sandboxData.sandbox) {
          // Send MCP toggle to orchestrator (which forwards to sandbox and updates session)
          const toggleResponse = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/chat/${chatId}/toggle-mcp`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Device-ID': deviceId,
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({
              mcp_name: mcp.name,
              enabled: enabled,
              config: enabled ? mcp.config : null,
              user_id: session.user.id
            })
          })
          
          const toggleData = await toggleResponse.json()
          if (!toggleData.success) {
            if (toggleData.message === 'No active sandbox found') {
              setSandboxError('Sandbox connection lost. Please reconnect.')
            }
            throw new Error(toggleData.message || 'Failed to toggle MCP')
          }
        }
      }

      if (enabled) {
        // Add MCP to enabled list
        setEnabledMcps(prev => [
          ...prev.filter(m => m.name !== mcp.name),
          { name: mcp.name, config: mcp.config }
        ])
      } else {
        // Remove MCP from enabled list
        setEnabledMcps(prev => prev.filter(m => m.name !== mcp.name))
      }
    } catch (error) {
      console.error('Error toggling MCP:', error)
    } finally {
      setLoading(prev => ({ ...prev, [mcp.name]: false }))
    }
  }

  const isMcpEnabled = (mcpName) => {
    return enabledMcps.some(m => m.name === mcpName)
  }

  const getActiveMcps = () => {
    return availableMcps.filter(mcp => isMcpEnabled(mcp.name))
  }

  const getInactiveMcps = () => {
    return availableMcps.filter(mcp => !isMcpEnabled(mcp.name))
  }

  if (loadingMcps) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading MCPs...</p>
        </div>
      </div>
    )
  }

  const handleReconnect = async () => {
    setSandboxError(null)
    // This will be passed from parent ChatInterface
    if (typeof onReconnect === 'function') {
      await onReconnect()
    }
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {sandboxError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Sandbox Connection Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{sandboxError}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReconnect}
              disabled={loadingMcps || Object.values(loading).some(Boolean)}
              className="ml-4"
            >
              {loadingMcps ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Reconnecting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reconnect
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">MCP Tools</h2>
            <p className="text-sm text-muted-foreground">
              Model Context Protocol tools for your chat session.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleCreateMcp}>
            <Plus className="h-4 w-4 mr-2" />
            Add New MCP
          </Button>
        </div>
        {!sandboxCreated && (
          <div className="bg-muted/50 border border-muted rounded-lg p-3 mb-4">
            <p className="text-sm text-muted-foreground">
              Create a sandbox first to manage MCPs.
            </p>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        {/* Active MCPs */}
        {getActiveMcps().length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Active MCPs
              </h3>
              <span className="text-xs text-muted-foreground">
                {getActiveMcps().length} active
              </span>
            </div>
            <div className="space-y-2">
              {getActiveMcps().map((mcp) => (
                <div
                  key={mcp.name}
                  className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleConfigureMcp(mcp)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{mcp.title}</h4>
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                          Active
                        </span>
                        {mcp.config?.env && Object.keys(mcp.config.env).length > 0 && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                            Configured
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {mcp.description}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {mcp.config?.command} {mcp.config?.args?.join(' ')}
                      </p>
                    </div>
                    <Switch
                      checked={true}
                      onCheckedChange={(checked) => {
                        toggleMcp(mcp, checked)
                      }}
                      disabled={!sandboxCreated || loading[mcp.name]}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available MCPs */}
        <div>
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">
            Available MCPs
          </h3>
          <div className="space-y-2">
            {getInactiveMcps().map((mcp) => {
              const isLoading = loading[mcp.name]
              const hasEnvVars = mcp.config.env && Object.keys(mcp.config.env).length > 0

              return (
                <div
                  key={mcp.name}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{mcp.title}</h4>
                        {hasEnvVars && (
                          <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                            Config Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {mcp.description}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {mcp.config.command} {mcp.config.args.join(' ')}
                      </p>
                    </div>
                    <Switch
                      checked={false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleConfigureMcp(mcp)
                        }
                      }}
                      disabled={!sandboxCreated || isLoading}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Config Dialog */}
      <MCPConfigDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        mcp={selectedMcp}
        mode={dialogMode}
        onSuccess={handleDialogSuccess}
      />
    </div>
  )
}