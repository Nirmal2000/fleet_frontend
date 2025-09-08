import { Card, CardContent } from '@/components/ui/card'

export function WelcomeScreen() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-medium mb-2">Welcome to Fleet</h3>
          <p className="text-muted-foreground">Select a chat session from the sidebar or create a new one to get started.</p>
        </CardContent>
      </Card>
    </div>
  )
}