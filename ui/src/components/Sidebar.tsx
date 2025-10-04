import { useQuery } from '@tanstack/react-query'
import { listFiles, type FileNode } from '../lib/api'

export function Sidebar({ selectedPath, onSelect }: { selectedPath?: string; onSelect: (p: string) => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['files', ''],
    queryFn: () => listFiles(''),
  })

  return (
    <div className="h-full overflow-y-auto border-r border-border-color bg-card-background text-foreground">
      <div className="p-4 text-sm font-semibold">Files</div>
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
