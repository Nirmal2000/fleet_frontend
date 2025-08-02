"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function MCPCard({ 
  mcp, 
  onEnable, 
  isLoading, 
  sandboxCreated
}) {
  const hasEnvVars = mcp.config.env && Object.keys(mcp.config.env).length > 0

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{mcp.title}</h3>
              {hasEnvVars && (
                <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                  Env Vars
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {mcp.description}
            </p>
            <div className="text-xs text-muted-foreground">
              <strong>Command:</strong> {mcp.config.command} {mcp.config.args.join(' ')}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEnable(mcp)}
            disabled={!sandboxCreated || isLoading}
            className="ml-4"
          >
            {isLoading ? 'Enabling...' : 'Enable'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}