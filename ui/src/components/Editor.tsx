import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { readFile, writeFile } from '../lib/api'

export function Editor({ path }: { path?: string }) {
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
  const [preview, setPreview] = useState(false)

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
    },
  })

  const extensions = useMemo(() => [markdown()], [])

  if (!path) return <div className="p-4 text-sm text-text-secondary">Select a file from the left to begin.</div>
  if (isLoading) return <div className="p-4 text-sm text-text-secondary">Loading...</div>
  if (error) return <div className="p-4 text-sm text-red-500">Failed to load file.</div>

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 border-b border-border-color p-2 bg-card-background">
        <div className="text-sm text-text-secondary flex-1 truncate">{path}</div>
        <button
          className="px-3 py-1.5 text-sm rounded bg-primary text-white hover:opacity-90"
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
        >
          {saveMut.isPending ? 'Saving...' : 'Save'}
        </button>
        <button
          className="px-3 py-1.5 text-sm rounded border border-border-color hover:bg-background"
          onClick={() => setPreview(p => !p)}
        >
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {preview ? (
          <div className="max-w-none p-4 overflow-auto h-full bg-card-background text-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <CodeMirror
            value={content}
            height="100%"
            basicSetup={{ lineNumbers: true }}
            extensions={extensions}
            onChange={setContent}
            theme="light"
          />
        )}
      </div>
    </div>
  )
}
