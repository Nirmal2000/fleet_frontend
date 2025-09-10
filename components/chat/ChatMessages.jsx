import { Button } from '@/components/ui/button'
import { Pencil, Trash } from 'lucide-react'
import {
  ChatContainerRoot,
  ChatContainerContent,
} from '@/components/ui/chat-container'
import {
  Message,
  MessageContent,
  MessageActions,
  MessageAction,
} from '@/components/ui/message'
import { ScrollButton } from '@/components/ui/scroll-button'
import { Tool } from '@/components/ui/tool'
import { Image } from '@/components/ui/image'

export function ChatMessages({ messages, loading, isProcessing, messagesEndRef }) {
  return (
    <ChatContainerRoot className="flex-1 min-h-0 relative">
      <ChatContainerContent className="space-y-4 px-5 py-12">
        {messages.map((message, index) => (
          <div key={index} className="mx-auto w-full max-w-3xl px-6">
            <Message
              className={message.role === 'user' ? 'justify-end' : 'justify-start'}
            >
            {message.role === 'tool' ? (
              <div className="max-w-[85%] space-y-2">
                {/* Support both streaming shape (tool_name/state/input/output) and persisted OR shape (name/content) */}
                {(() => {
                  const isStreaming = !!message.tool_name
                  const toolPart = isStreaming
                    ? {
                        type: message.tool_name,
                        state: message.state,
                        input: message.input,
                        output: message.output,
                      }
                    : {
                        type: message.name || 'tool',
                        state: 'output-available',
                        input: {},
                        output: message.content
                          ? { result: message.content }
                          : null,
                      }
                  return <Tool toolPart={toolPart} />
                })()}
              </div>
            ) : (
              <>
                <MessageContent
                  markdown
                  className={`max-w-[70%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-2xl px-4 py-2'
                      : 'bg-transparent text-foreground rounded-none p-0 shadow-none dark:prose-invert prose-headings:font-semibold prose-p:leading-relaxed'
                  }`}
                >
                  {message.content}
                </MessageContent>
                {/* No copy/like/dislike actions for assistant */}
                {message.role === 'user' && (
                  <MessageActions className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MessageAction tooltip="Edit">
                      <Button variant="ghost" size="icon" className="size-6">
                        <Pencil className="size-3" />
                      </Button>
                    </MessageAction>
                    <MessageAction tooltip="Delete">
                      <Button variant="ghost" size="icon" className="size-6">
                        <Trash className="size-3" />
                      </Button>
                    </MessageAction>
                  </MessageActions>
                )}
              </>
            )}
            </Message>
          </div>
        ))}
        {loading && (
          <div className="mx-auto w-full max-w-3xl px-6">
            <Message className="justify-start">
              <MessageContent className="bg-transparent text-foreground rounded-none p-0 shadow-none dark:prose-invert">
                <div className="text-sm">Thinking...</div>
              </MessageContent>
            </Message>
          </div>
        )}
        <div ref={messagesEndRef} />
      </ChatContainerContent>
      <div className="absolute bottom-4 left-1/2 flex w-full max-w-3xl -translate-x-1/2 justify-end px-5">
        <ScrollButton className="shadow-sm" />
      </div>
    </ChatContainerRoot>
  )
}
