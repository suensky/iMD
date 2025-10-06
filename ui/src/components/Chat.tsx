import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Bot, ChevronRight } from 'lucide-react'
import { aiChat, writeFile } from '../lib/api'
import { Tooltip } from './Tooltip'

type ChatProps = {
  path?: string
  onApplied?: () => void
  onCollapse?: () => void
  onExpand?: () => void
  isCollapsed?: boolean
}

export function Chat({ path, onApplied, onCollapse, onExpand, isCollapsed }: ChatProps) {
  const [message, setMessage] = useState('')
  const [logs, setLogs] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([])

  const askMut = useMutation({
    mutationFn: async () => {
      if (!path || !message.trim()) return
      const res = await aiChat({ path, mode: 'ask', message })
      return res as { answer: string }
    },
    onSuccess: (res) => {
      setLogs((l) => [...l, { role: 'user', text: message }, { role: 'assistant', text: res.answer }])
      setMessage('')
    },
  })

  const editMut = useMutation({
    mutationFn: async () => {
      if (!path || !message.trim()) return
      const res = await aiChat({ path, mode: 'edit', message })
      if ('proposedContent' in res) {
        await writeFile(path, res.proposedContent)
      }
      return res
    },
    onSuccess: (res) => {
      if ('proposedContent' in res) {
        setLogs((l) => [...l, { role: 'user', text: message }, { role: 'assistant', text: 'Applied proposed changes.' }])
        setMessage('')
        onApplied?.()
      }
    },
  })

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
      <div className="flex-1 overflow-auto p-4 space-y-3 text-sm border-b border-border-color">
        {logs.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-foreground' : 'text-primary'}>
            <span className="font-semibold mr-2">{m.role === 'user' ? 'You' : 'AI'}:</span>
            <span className="whitespace-pre-wrap">{m.text}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-border-color p-4 space-y-2">
        <textarea
          className="w-full h-24 rounded bg-card-background text-foreground p-2 border border-border-color focus:outline-none placeholder-text-secondary"
          placeholder="Ask about or instruct changes to the open markdown..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex gap-2 justify-end">
          <button
            className="px-3 py-1.5 text-sm rounded border border-border-color hover:bg-background"
            onClick={() => askMut.mutate()}
            disabled={askMut.isPending || editMut.isPending}
          >
            {askMut.isPending ? 'Asking…' : 'Ask'}
          </button>
          <button
            className="px-3 py-1.5 text-sm rounded bg-primary text-white hover:opacity-90"
            onClick={() => editMut.mutate()}
            disabled={askMut.isPending || editMut.isPending}
          >
            {editMut.isPending ? 'Applying…' : 'Edit and Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}
