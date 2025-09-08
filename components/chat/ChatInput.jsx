import { Button } from '@/components/ui/button'
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/ui/prompt-input'
import { Globe, Mic, MoreHorizontal, Plus, ArrowUp } from 'lucide-react'

export function ChatInput({
  inputMessage,
  setInputMessage,
  loading,
  sandboxCreated,
  onSendMessage
}) {
  return (
    <div className="mt-4">
      <PromptInput
        isLoading={loading}
        value={inputMessage}
        onValueChange={setInputMessage}
        onSubmit={onSendMessage}
        className="border-input bg-popover relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-xs"
        disabled={!sandboxCreated}
      >
        <div className="flex flex-col">
          <PromptInputTextarea
            placeholder="Ask anything"
            className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base"
          />

          <PromptInputActions className="mt-5 flex w-full items-center justify-between gap-2 px-3 pb-3">
            <div className="flex items-center gap-2">
              <PromptInputAction tooltip="Add a new action">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-full"
                >
                  <Plus size={18} />
                </Button>
              </PromptInputAction>

              <PromptInputAction tooltip="Search">
                <Button variant="outline" className="rounded-full">
                  <Globe size={18} />
                  Search
                </Button>
              </PromptInputAction>

              <PromptInputAction tooltip="More actions">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-full"
                >
                  <MoreHorizontal size={18} />
                </Button>
              </PromptInputAction>
            </div>
            <div className="flex items-center gap-2">
              <PromptInputAction tooltip="Voice input">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-full"
                >
                  <Mic size={18} />
                </Button>
              </PromptInputAction>

              <Button
                size="icon"
                disabled={!inputMessage.trim() || loading || !sandboxCreated}
                onClick={onSendMessage}
                className="size-9 rounded-full"
              >
                {!loading ? (
                  <ArrowUp size={18} />
                ) : (
                  <span className="size-3 rounded-xs bg-white" />
                )}
              </Button>
            </div>
          </PromptInputActions>
        </div>
      </PromptInput>
    </div>
  )
}