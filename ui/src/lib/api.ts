// Simple API client for the backend
export type FileNode = {
  name: string
  path: string // relative to workspace
  is_dir: boolean
  size?: number
  modified_at?: string
}

export type FileContent = {
  path: string
  content: string
}

const base = '/api'

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export async function listFiles(path = ''): Promise<FileNode[]> {
  const u = new URL(`${base}/files`, window.location.origin)
  if (path) u.searchParams.set('path', path)
  return http<FileNode[]>(u.toString())
}

export async function readFile(path: string): Promise<FileContent> {
  const u = new URL(`${base}/file`, window.location.origin)
  u.searchParams.set('path', path)
  return http<FileContent>(u.toString())
}

export async function writeFile(path: string, content: string): Promise<{ ok: boolean }> {
  const u = new URL(`${base}/file`, window.location.origin)
  u.searchParams.set('path', path)
  return http<{ ok: boolean }>(u.toString(), {
    method: 'PUT',
    body: JSON.stringify({ content }),
  })
}

export type AIChatRequest = {
  path: string
  mode: 'ask' | 'edit'
  message: string
  selection?: string
}

export type AIChatResponseAsk = { answer: string }
export type AIChatResponseEdit = { proposedContent: string }

export type AIChatStreamEvent =
  | { type: 'delta'; text: string }
  | ({ type: 'final' } & (AIChatResponseAsk | AIChatResponseEdit))

type AIChatFinalEvent = Extract<AIChatStreamEvent, { type: 'final' }>

export async function aiChatStream(
  req: AIChatRequest,
  onEvent: (event: AIChatStreamEvent) => void,
): Promise<AIChatFinalEvent> {
  const res = await fetch(`${base}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }

  if (!res.body) {
    throw new Error('Readable stream not supported in this browser.')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let finalEvent: AIChatFinalEvent | null = null

  const handleLine = (line: string) => {
    if (!line) return
    let event: AIChatStreamEvent
    try {
      event = JSON.parse(line) as AIChatStreamEvent
    } catch (error) {
      throw new Error(`Failed to parse AI stream chunk: ${(error as Error).message}`)
    }
    onEvent(event)
    if (event.type === 'final') {
      finalEvent = event
    }
  }

  const flushBuffer = (emitRemainder = false) => {
    while (true) {
      const newlineIndex = buffer.indexOf('\n')
      if (newlineIndex === -1) break
      const line = buffer.slice(0, newlineIndex).trim()
      buffer = buffer.slice(newlineIndex + 1)
      if (!line) continue
      handleLine(line)
    }

    if (emitRemainder) {
      const line = buffer.trim()
      buffer = ''
      if (line) handleLine(line)
    }
  }

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    flushBuffer()
  }

  buffer += decoder.decode()
  flushBuffer(true)

  if (!finalEvent) {
    throw new Error('Stream ended without a final AI response.')
  }

  return finalEvent
}
