import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, FileText, Plus } from 'lucide-react'
import { listFiles, type FileNode, writeFile } from '../lib/api'
import { Tooltip } from './Tooltip'

type SidebarProps = {
  selectedPath?: string
  onSelect: (p: string) => void
  onCollapse: () => void
  onExpand: () => void
  isCollapsed: boolean
}

export function Sidebar({ selectedPath, onSelect, onCollapse, onExpand, isCollapsed }: SidebarProps) {
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
      <div className="h-full border-r border-border-color bg-card-background text-foreground flex flex-col items-center py-4 gap-3">
        <Tooltip label="Expand sidebar">
          <button
            type="button"
            aria-label="Expand file explorer"
            className="rounded-full border border-border-color p-1 text-text-secondary hover:text-foreground hover:bg-background"
            onClick={onExpand}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </Tooltip>
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
    <div className="h-full overflow-y-auto border-r border-border-color bg-card-background text-foreground">
      <div className="p-4 text-sm font-semibold flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>Files</span>
          <Tooltip label="Close sidebar">
            <button
              type="button"
              aria-label="Collapse file explorer"
              className="rounded-full border border-border-color p-1 text-text-secondary hover:text-foreground hover:bg-background"
              onClick={onCollapse}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
        <button
          className="text-xs px-2 py-1 rounded bg-primary text-white hover:opacity-90 disabled:opacity-60"
          onClick={handleCreate}
          disabled={createFileMut.isPending}
        >
          {createFileMut.isPending ? 'Creating…' : '+ New'}
        </button>
      </div>
      {isLoading && <div className="p-4 text-sm text-text-secondary">Loading...</div>}
      {error && <div className="p-4 text-sm text-red-500">Failed to load files</div>}
      <ul className="text-sm">
        {files.map((f: FileNode) => (
          <li key={f.path}>
            <button
              className={`w-full text-left px-4 py-2 transition-colors rounded hover:bg-primary-10 hover:text-primary ${selectedPath === f.path ? 'bg-primary-10 text-primary' : 'text-foreground'}`}
              onClick={() => onSelect(f.path)}
            >
              {f.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
