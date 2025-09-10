export function WelcomeScreen() {
  return (
    <div className="flex-1 flex items-start justify-center pt-12">
      <div className="p-8 text-center max-w-2xl">
        <h3 className="text-2xl font-medium mb-3">Welcome to Fleet</h3>
        <p className="text-base text-muted-foreground">Select a chat session from the sidebar or create a new one to get started.</p>
      </div>
    </div>
  )
}