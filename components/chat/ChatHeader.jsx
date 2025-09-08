import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function ChatHeader({ session, onSignOut }) {
  return (
    <header className="bg-background z-10 flex h-16 w-full shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      {/* <div className="text-foreground">Project roadmap discussion</div> */}
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{session.user.email}</span>
        <Button variant="outline" onClick={onSignOut}>
          Sign Out
        </Button>
      </div>
    </header>
  )
}