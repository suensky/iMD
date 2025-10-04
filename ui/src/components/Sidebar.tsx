import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listFiles, type FileNode, writeFile } from '../lib/api'

type SidebarProps = {
  selectedPath?: string
  onSelect: (p: string) => void
}

export function Sidebar({ selectedPath, onSelect }: SidebarProps) {
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

  return (
    <div className="h-full overflow-y-auto border-r border-border-color bg-card-background text-foreground">
      <div className="p-4 text-sm font-semibold flex items-center justify-between gap-2">
        <span>Files</span>
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
        {(data ?? []).filter(f => !f.is_dir && f.name.endsWith('.md')).map((f: FileNode) => (
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
