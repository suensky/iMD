import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeMathjax from 'rehype-mathjax'
import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import type { EditorView } from '@codemirror/view'
import { readFile, writeFile } from '../lib/api'
import {
  remarkDefinitionLists,
  remarkEmoji,
  remarkLineBlocks,
  remarkPandocTables,
  remarkSubSuperscript,
  remarkSmartPunctuation,
} from '../lib/markdownPlugins'
import type { Components } from 'react-markdown'
import { Tooltip } from './Tooltip'

const markdownComponents: Components = {
  a: props => <a {...props} target="_blank" rel="noopener noreferrer" className="markdown-link" />,
  code: ({ inline, className, children, ...props }) => {
    const language = /language-(\w+)/.exec(className ?? '')?.[1]

    if (inline) {
      return (
        <code className="markdown-code-inline" {...props}>
          {children}
        </code>
      )
    }

    return (
      <pre className="markdown-code-block" data-language={language}>
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    )
  },
  table: ({ node, ...props }) => {
    const caption = typeof node?.data?.caption === 'string' ? node.data.caption : undefined
    const table = <table {...props} />
    if (!caption) return table
    return (
      <figure className="markdown-table-wrapper">
        {table}
        <figcaption className="markdown-table-caption">{caption}</figcaption>
      </figure>
    )
  },
}

type EditorProps = {
  path?: string
  onPathChange?: (next: string) => void
}

export function Editor({ path, onPathChange }: EditorProps) {
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['file', path],
    queryFn: () => {
      if (!path) throw new Error('No file selected')
      return readFile(path)
    },
    enabled: !!path,
  })

  const [content, setContent] = useState('')
  const [isPreviewOpen, setPreviewOpen] = useState(false)
  const [editorView, setEditorView] = useState<EditorView | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const scrollSyncLockRef = useRef<'editor' | 'preview' | null>(null)

  useEffect(() => {
    setContent(data?.content ?? '')
  }, [data?.content])

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!path) return
      return writeFile(path, content)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['file', path] })
      qc.invalidateQueries({ queryKey: ['files'] })
      qc.invalidateQueries({ queryKey: ['files', ''] })
    },
    onError: err => {
      console.error(err)
      window.alert('Failed to save file. Please try again.')
    },
  })

  const saveAsMut = useMutation({
    mutationFn: async (nextPath: string) => {
      await writeFile(nextPath, content)
      return nextPath
    },
    onSuccess: nextPath => {
      qc.invalidateQueries({ queryKey: ['file', path] })
      qc.invalidateQueries({ queryKey: ['file', nextPath] })
      qc.invalidateQueries({ queryKey: ['files'] })
      qc.invalidateQueries({ queryKey: ['files', ''] })
      onPathChange?.(nextPath)
    },
    onError: err => {
      console.error(err)
      window.alert('Failed to save file. Please try again with a different name or location.')
    },
  })

  const extensions = useMemo(() => [markdown()], [])
  const previewPlugins = useMemo(
    () => [
      remarkGfm,
      remarkMath,
      remarkPandocTables,
      remarkDefinitionLists,
      remarkLineBlocks,
      remarkSubSuperscript,
      remarkEmoji,
      remarkSmartPunctuation,
    ],
    [],
  )
  const previewRehypePlugins = useMemo(() => [rehypeMathjax], [])

  const isDirty = content !== (data?.content ?? '')

  useEffect(() => {
    const editorScrollEl = editorView?.scrollDOM
    const previewScrollEl = previewRef.current

    if (!editorScrollEl || !previewScrollEl) return

    let frame: number | null = null

    const syncScroll = (source: 'editor' | 'preview') => {
      const from = source === 'editor' ? editorScrollEl : previewScrollEl
      const to = source === 'editor' ? previewScrollEl : editorScrollEl

      if (!to) return
      if (scrollSyncLockRef.current && scrollSyncLockRef.current !== source) return

      const fromScrollable = from.scrollHeight - from.clientHeight
      const toScrollable = to.scrollHeight - to.clientHeight

      if (fromScrollable <= 0 || toScrollable <= 0) return

      const ratio = from.scrollTop / fromScrollable

      scrollSyncLockRef.current = source

      if (frame) cancelAnimationFrame(frame)

      frame = requestAnimationFrame(() => {
        to.scrollTop = ratio * toScrollable
        scrollSyncLockRef.current = null
      })
    }

    const handleEditorScroll = () => syncScroll('editor')
    const handlePreviewScroll = () => syncScroll('preview')

    editorScrollEl.addEventListener('scroll', handleEditorScroll)
    previewScrollEl.addEventListener('scroll', handlePreviewScroll)

    syncScroll('editor')

    return () => {
      editorScrollEl.removeEventListener('scroll', handleEditorScroll)
      previewScrollEl.removeEventListener('scroll', handlePreviewScroll)
      if (frame) cancelAnimationFrame(frame)
      scrollSyncLockRef.current = null
    }
  }, [editorView, isPreviewOpen])

  const handleSave = () => {
    if (!path || !isDirty) return
    saveMut.mutate()
  }

  const handleSaveAs = () => {
    const suggested = path ?? 'untitled.md'
    const input = window.prompt('Save file as', suggested)
    if (!input) return
    const trimmed = input.trim()
    if (!trimmed) return
    if (!trimmed.endsWith('.md')) {
      window.alert('Filename must end with ".md"')
      return
    }
    if (trimmed === path) {
      handleSave()
      return
    }
    saveAsMut.mutate(trimmed)
  }

  if (!path) return <div className="h-full bg-card-background" />
  if (isLoading) return <div className="p-4 text-sm text-text-secondary">Loading...</div>
  if (error) return <div className="p-4 text-sm text-red-500">Failed to load file.</div>

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 border-b border-border-color p-2 bg-card-background">
        <div className="text-sm text-text-secondary flex-1 truncate">{path}</div>
        <button
          className="px-3 py-1.5 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-60"
          onClick={handleSave}
          disabled={!isDirty || saveMut.isPending || saveAsMut.isPending}
        >
          {saveMut.isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          className="px-3 py-1.5 text-sm rounded border border-border-color hover:bg-background"
          onClick={handleSaveAs}
          disabled={saveAsMut.isPending || saveMut.isPending}
        >
          {saveAsMut.isPending ? 'Saving…' : 'Save As'}
        </button>
        <Tooltip label="Preview">
          <button
            className="p-2 rounded border border-border-color hover:bg-background text-text-secondary"
            onClick={() => setPreviewOpen(p => !p)}
            aria-label={isPreviewOpen ? 'Close preview' : 'Open preview'}
          >
            {isPreviewOpen ? (
              <PanelRightClose className="h-4 w-4" aria-hidden="true" />
            ) : (
              <PanelRightOpen className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </Tooltip>
      </div>
      <div className="flex-1 min-h-0 flex bg-card-background">
        <div
          className={`flex-1 min-w-0 h-full ${
            isPreviewOpen ? 'border-r border-border-color' : ''
          }`}
        >
          <CodeMirror
            value={content}
            height="100%"
            basicSetup={{ lineNumbers: true }}
            extensions={extensions}
            onChange={setContent}
            onCreateEditor={view => setEditorView(view)}
            theme="light"
            className="h-full bg-card-background"
          />
        </div>
        {isPreviewOpen ? (
          <div
            ref={previewRef}
            className="flex-1 min-w-0 h-full overflow-auto p-4 text-foreground"
          >
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={previewPlugins}
                rehypePlugins={previewRehypePlugins}
                components={markdownComponents}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
