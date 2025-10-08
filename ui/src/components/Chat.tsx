import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowUp, Bot, ChevronRight, Copy } from 'lucide-react'
import { aiChat } from '../lib/api'
import { Tooltip } from './Tooltip'

type ChatLogEntry = {
  id: string
  role: 'user' | 'assistant'
  text: string
  status?: 'pending' | 'done'
}

type ChatProps = {
  path?: string
  onCollapse?: () => void
  onExpand?: () => void
  isCollapsed?: boolean
}

const createEntryId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 10)
}

export function Chat({ path, onCollapse, onExpand, isCollapsed }: ChatProps) {
  const [message, setMessage] = useState('')
  const [logs, setLogs] = useState<ChatLogEntry[]>([])
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const askMut = useMutation<{ answer: string }, Error, string, { placeholderId: string }>({
    mutationFn: async (input) => {
      if (!path) {
        throw new Error('Cannot ask without an open file path.')
      }
      const res = await aiChat({ path, mode: 'ask', message: input })
      return res as { answer: string }
    },
    onMutate: (input) => {
      const userEntry: ChatLogEntry = { id: createEntryId(), role: 'user', text: input }
      const placeholderId = createEntryId()
      const placeholderEntry: ChatLogEntry = {
        id: placeholderId,
        role: 'assistant',
        text: 'Thinking…',
        status: 'pending',
      }
      setLogs((prev) => [...prev, userEntry, placeholderEntry])
      return { placeholderId }
    },
    onSuccess: (res, _input, context) => {
      if (!context) return
      setLogs((prev) =>
        prev.map((entry) =>
          entry.id === context.placeholderId
            ? { ...entry, text: res.answer, status: 'done' }
            : entry,
        ),
      )
    },
    onError: (_error, _input, context) => {
      if (!context) return
      setLogs((prev) =>
        prev.map((entry) =>
          entry.id === context.placeholderId
            ? {
                ...entry,
                text: 'I ran into a hiccup answering just now. Please try again.',
                status: 'done',
              }
            : entry,
        ),
      )
    },
  })

  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
  }, [message])

  const isPending = askMut.isPending
  const hasMessage = message.trim().length > 0

  const handleSend = () => {
    if (!path || !hasMessage || isPending) return
    const content = message.trim()
    setMessage('')
    askMut.mutate(content)
  }

  const handleCopy = async (text: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy message', error)
    }
  }

  if (isCollapsed) {
    return (
      <div className="h-full border-l border-border-color bg-card-background text-foreground flex flex-col items-center justify-start py-4">
        <Tooltip label="Expand AI panel">
          <button
            type="button"
            aria-label="Expand AI panel"
            className="rounded-full border border-border-color p-2 text-text-secondary hover:text-foreground hover:bg-background"
            onClick={() => onExpand?.()}
          >
            <Bot className="h-5 w-5" aria-hidden="true" />
          </button>
        </Tooltip>
      </div>
    )
  }

  const header = (
    <div className="flex items-center justify-between border-b border-border-color bg-card-background px-4 py-3">
      <span className="text-sm font-semibold">Ask AI</span>
      {onCollapse && (
        <Tooltip label="Close sidebar">
          <button
            type="button"
            aria-label="Collapse AI panel"
            className="rounded-full border border-border-color p-1 text-text-secondary hover:text-foreground hover:bg-background"
            onClick={onCollapse}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </Tooltip>
      )}
    </div>
  )

  if (!path)
    return (
      <div className="h-full flex flex-col bg-card-background text-foreground">
        {header}
        <div className="p-3 text-sm text-text-secondary">Open a file to chat.</div>
      </div>
    )

  return (
    <div className="h-full flex flex-col bg-card-background text-foreground">
      {header}
      <div className="flex-1 overflow-auto p-4 space-y-5 text-sm border-b border-border-color">
        {logs.map((m) => {
          const isUser = m.role === 'user'
          return (
            <div
              key={m.id}
              className={`group flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex max-w-[85%] flex-col gap-2 ${
                  isUser ? 'items-end text-foreground' : 'items-start text-foreground'
                }`}
              >
                <div
                  className={`w-fit rounded-2xl px-4 py-3 leading-6 ${
                    isUser
                      ? 'bg-white text-foreground border border-border-color shadow-sm'
                      : 'text-foreground'
                  }`}
                >
                  <span className="whitespace-pre-wrap">{m.text}</span>
                </div>
                {isUser ? (
                  <Tooltip label="Copy message">
                    <button
                      type="button"
                      aria-label="Copy message"
                      onClick={() => handleCopy(m.text)}
                      className="inline-flex items-center gap-1 text-xs text-text-secondary opacity-0 transition focus-visible:opacity-100 hover:text-foreground group-hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </Tooltip>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
      <div className="border-t border-border-color p-4 space-y-3">
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
        >
          <div className="relative rounded-3xl border border-border-color bg-background/70 px-4 py-2.5 shadow-sm transition focus-within:border-primary focus-within:shadow-[0_0_0_1px_rgba(59,130,246,0.35)]">
            <textarea
              ref={textareaRef}
              className="max-h-40 min-h-[24px] w-full resize-none bg-transparent pr-12 text-sm leading-5 text-foreground placeholder:text-text-secondary focus:outline-none"
              placeholder="Ask about or instruct changes to the open markdown..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              rows={1}
            />
            <div className="pointer-events-none absolute bottom-2.5 right-2.5">
              <button
                type="submit"
                className={`pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  hasMessage && !isPending
                    ? 'bg-primary text-white hover:opacity-90'
                    : 'bg-border-color text-text-secondary'
                }`}
                aria-label="Send message"
                disabled={!hasMessage || isPending}
              >
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <p className="text-xs text-text-secondary">Press Enter to send, Shift+Enter for a newline.</p>
        </form>
      </div>
    </div>
  )
}
