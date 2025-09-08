import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export function SandboxStatus({ sandboxError, loading, onReconnect }) {
  if (sandboxError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Sandbox Connection Error</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{sandboxError}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onReconnect}
            disabled={loading}
            className="ml-4"
          >
            {loading ? (
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
    )
  }

  return (
    <Card className="flex-1 flex items-center justify-center">
      <CardContent>
        <div className="text-center space-y-4">
          <h3 className="text-lg font-medium">Setting up sandbox...</h3>
          <p className="text-muted-foreground">Please wait while we prepare your chat environment</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </CardContent>
    </Card>
  )
}