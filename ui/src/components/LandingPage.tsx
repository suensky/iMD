import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Info, Mic, Send } from 'lucide-react'

type LandingMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 10)
}

export function LandingPage() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<LandingMessage[]>(() => [
    {
      id: createId(),
      role: 'assistant',
      text: "Hi there! I'm SeaStar — ask anything or describe what you would like me to create.",
    },
  ])

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const hasInput = input.trim().length > 0

  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
  }, [input])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!hasInput) return
    const trimmed = input.trim()
    const userEntry: LandingMessage = { id: createId(), role: 'user', text: trimmed }
    const assistantEntry: LandingMessage = {
      id: createId(),
      role: 'assistant',
      text: "I'm ready to help — integrations with workspace tools are coming soon!",
    }
    setMessages(prev => [...prev, userEntry, assistantEntry])
    setInput('')
  }

  const renderedMessages = useMemo(
    () =>
      messages.map(message => {
        const isUser = message.role === 'user'
        return (
          <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-6 ${
                isUser ? 'bg-primary text-white' : 'bg-card-background text-foreground shadow'
              }`}
            >
              {message.text}
            </div>
          </div>
        )
      }),
    [messages],
  )

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto p-8">
      <div className="w-full max-w-3xl flex-1 flex flex-col justify-center">
        <h1 className="mb-8 text-center text-4xl font-bold">SeaStar Super Agent</h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="space-y-4">
            <div className="space-y-3">{renderedMessages}</div>
            <form className="relative" onSubmit={handleSubmit}>
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Ask anything, create anything"
                className="w-full resize-none rounded-xl border border-border-color bg-transparent px-4 py-3 pr-24 text-sm leading-6 text-foreground placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={input}
                onChange={event => setInput(event.target.value)}
              />
              <div className="absolute bottom-2 right-3 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg p-2 text-text-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label="Record audio"
                >
                  <Mic className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-text-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label="Attach media"
                >
                  <Camera className="h-5 w-5" />
                </button>
                <button
                  type="submit"
                  disabled={!hasInput}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                    hasInput
                      ? 'bg-primary text-white hover:opacity-90'
                      : 'bg-border-color text-text-secondary cursor-not-allowed'
                  }`}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
          <div className="rounded-full bg-white/80 p-1">
            <Info className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            SeaStar supports personalized tools that connect your documents, slides, and more.
          </div>
        </div>
      </div>
    </div>
  )
}
