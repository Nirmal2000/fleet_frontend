"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export default function ActiveMCPsList({ 
  activeMcps, 
  onConfigureMcp,
  onDisableMcp, 
  sandboxCreated, 
  loading 
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Active MCPs</h3>
        <span className="text-xs text-muted-foreground">{activeMcps.length} active</span>
      </div>
      
      {activeMcps.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">No MCPs are active for this chat</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {activeMcps.map((mcp) => (
            <Card key={mcp.name} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => onConfigureMcp(mcp)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{mcp.title}</h3>
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                        Active
                      </span>
                      {mcp.config?.env && Object.keys(mcp.config.env).length > 0 && (
                        <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                          Configured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {mcp.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      <strong>Command:</strong> {mcp.config?.command} {mcp.config?.args?.join(' ')}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDisableMcp(mcp)
                    }}
                    disabled={!sandboxCreated || loading[mcp.name]}
                    className="ml-4"
                  >
                    {loading[mcp.name] ? 'Disabling...' : <X className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}