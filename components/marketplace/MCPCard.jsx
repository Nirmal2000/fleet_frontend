"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, Copy } from 'lucide-react'
import { Wrench as Tool } from 'lucide-react'

function getStatusBadge(status) {
  const common = 'text-xs px-2 py-0.5 rounded'
  if (status === 'running' || status === 'pending') return <span className={`${common} bg-blue-600/20 text-blue-400`}>Running</span>
  if (status === 'failed') return <span className={`${common} bg-red-600/20 text-red-400`}>Failed</span>
  if (status === 'succeeded') return <span className={`${common} bg-green-600/20 text-green-400`}>Live</span>
  return null
}

export default function MCPCard({ mcp, onClick }) {
  const tools = mcp.tools || []
  const displayedTools = tools.slice(0, 10)

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
      </CardContent>

      <CardFooter className="flex-col space-y-2 pt-0">        
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          {/* {mcp.created_at ? <span>Created {new Date(mcp.created_at).toLocaleDateString()}</span> : <span />} */}
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

