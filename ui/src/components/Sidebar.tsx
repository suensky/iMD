import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, FileText, Plus } from 'lucide-react'
import { listFiles, type FileNode, writeFile } from '../lib/api'
import { Tooltip } from './Tooltip'

type SidebarProps = {
  selectedPath?: string
  onSelect: (p: string) => void
  onCollapse?: () => void
  onExpand?: () => void
  isCollapsed?: boolean
  variant?: 'standalone' | 'embedded'
  className?: string
  showCollapseControl?: boolean
}

const combineClasses = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ')

export function Sidebar({
  selectedPath,
  onSelect,
  onCollapse,
  onExpand,
  isCollapsed = false,
  variant = 'standalone',
  className,
  showCollapseControl = true,
}: SidebarProps) {
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['files', ''],
    queryFn: () => listFiles(''),
  })

  const createFileMut = useMutation({
    mutationFn: async (newPath: string) => {
      await writeFile(newPath, '')
      return newPath
    },
    onSuccess: newPath => {
      qc.invalidateQueries({ queryKey: ['files'] })
      qc.invalidateQueries({ queryKey: ['files', ''] })
      onSelect(newPath)
    },
    onError: err => {
      console.error(err)
      window.alert('Failed to create file. Make sure the name is valid and try again.')
    },
  })

  const handleCreate = () => {
    const suggested = 'new-note.md'
    const input = window.prompt('Enter a name for the new markdown file', suggested)
    if (!input) return
    const trimmed = input.trim()
    if (!trimmed) return
    if (!trimmed.endsWith('.md')) {
      window.alert('Filename must end with ".md"')
      return
    }
    createFileMut.mutate(trimmed)
  }

  const files = (data ?? []).filter(f => !f.is_dir && f.name.endsWith('.md'))

  if (isCollapsed) {
    return (
      <div
        className={combineClasses(
          'flex h-full flex-col items-center gap-3 bg-card-background py-4 text-foreground',
          variant === 'standalone' && 'border-r border-border-color',
          className,
        )}
      >
        {showCollapseControl && (
          <Tooltip label="Expand sidebar">
            <button
              type="button"
              aria-label="Expand file explorer"
              className="rounded-full border border-border-color p-1 text-text-secondary hover:bg-background hover:text-foreground"
              onClick={onExpand}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </Tooltip>
        )}
        <div className="flex-1 overflow-y-auto flex flex-col items-center gap-2 w-full">
          {isLoading && <span className="text-[11px] text-text-secondary">Loading…</span>}
          {error && !isLoading && <span className="text-[11px] text-red-500">Error</span>}
          {files.map(f => (
            <button
              key={f.path}
              type="button"
              aria-label={`Open ${f.name}`}
              className={`rounded-full p-2 transition-colors ${selectedPath === f.path ? 'text-primary bg-primary-10' : 'text-text-secondary hover:text-foreground hover:bg-background'}`}
              onClick={() => onSelect(f.path)}
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Create markdown file"
          className="rounded-full border border-border-color p-1 text-text-secondary hover:text-foreground hover:bg-background disabled:opacity-60"
          onClick={handleCreate}
          disabled={createFileMut.isPending}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={combineClasses(
        'flex h-full flex-col bg-card-background text-foreground',
        variant === 'standalone' && 'border-r border-border-color',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 text-sm font-semibold">
        <span>Files</span>
        <button
          className="rounded border border-border-color px-2 py-1 text-xs font-medium uppercase tracking-wide text-foreground transition hover:bg-background disabled:opacity-60"
          onClick={handleCreate}
          disabled={createFileMut.isPending}
        >
          {createFileMut.isPending ? 'Creating…' : '+ New'}
        </button>
      </div>
      {isLoading && <div className="px-4 py-2 text-sm text-text-secondary">Loading...</div>}
      {error && <div className="px-4 py-2 text-sm text-red-500">Failed to load files</div>}
      <ul className="flex-1 overflow-y-auto px-2 pb-4 text-sm">
        {files.map((f: FileNode) => (
          <li key={f.path}>
            <button
              className={`w-full rounded px-2 py-2 text-left transition-colors hover:bg-primary-10 hover:text-primary ${selectedPath === f.path ? 'bg-primary-10 text-primary' : 'text-foreground'}`}
              onClick={() => onSelect(f.path)}
            >
              {f.name}
            </button>
          </li>
        ))}
      </ul>
      {showCollapseControl && (
        <div className="border-t border-border-color px-4 py-3">
          <Tooltip label="Collapse sidebar">
            <button
              type="button"
              aria-label="Collapse file explorer"
              className="w-full rounded border border-border-color px-3 py-2 text-sm text-text-secondary transition hover:bg-background hover:text-foreground"
              onClick={onCollapse}
            >
              <div className="flex items-center justify-center gap-2">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span>Collapse</span>
              </div>
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  )
}
