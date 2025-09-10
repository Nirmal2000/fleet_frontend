import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export function SandboxStatus({ sandboxError, loading, onReconnect }) {
  if (sandboxError) {
    return (
      <Alert variant="destructive" className="mt-12 mb-4 max-w-2xl mx-auto">
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
    <div className="flex-1 flex items-start justify-center pt-12">
      <div className="text-center space-y-4 max-w-2xl">
        <h3 className="text-2xl font-medium">Setting up sandbox...</h3>
        <p className="text-base text-muted-foreground">Please wait while we prepare your chat environment</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  )
}