import { Button } from '@/components/ui/button'
import { Copy, ThumbsUp, ThumbsDown, Pencil, Trash } from 'lucide-react'
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
    <ChatContainerRoot className="flex-1 min-h-0">
      <ChatContainerContent className="p-4 space-y-4">
        {messages.map((message, index) => (
          <Message
            key={index}
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
                  markdown={message.role === 'assistant'}
                  className={`max-w-[70%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-foreground'
                  }`}
                >
                  {message.content}
                </MessageContent>
                {message.role === 'assistant' && (
                  <MessageActions className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MessageAction tooltip="Copy">
                      <Button variant="ghost" size="icon" className="size-6">
                        <Copy className="size-3" />
                      </Button>
                    </MessageAction>
                    <MessageAction tooltip="Upvote">
                      <Button variant="ghost" size="icon" className="size-6">
                        <ThumbsUp className="size-3" />
                      </Button>
                    </MessageAction>
                    <MessageAction tooltip="Downvote">
                      <Button variant="ghost" size="icon" className="size-6">
                        <ThumbsDown className="size-3" />
                      </Button>
                    </MessageAction>
                  </MessageActions>
                )}
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
                    <MessageAction tooltip="Copy">
                      <Button variant="ghost" size="icon" className="size-6">
                        <Copy className="size-3" />
                      </Button>
                    </MessageAction>
                  </MessageActions>
                )}
              </>
            )}
          </Message>
        ))}
        {loading && (
          <Message className="justify-start">
            <MessageContent className="bg-background text-foreground">
              <div className="text-sm">Thinking...</div>
            </MessageContent>
          </Message>
        )}
        <div ref={messagesEndRef} />
      </ChatContainerContent>
      <ScrollButton className="absolute bottom-4 left-1/2 -translate-x-1/2" />
    </ChatContainerRoot>
  )
}
