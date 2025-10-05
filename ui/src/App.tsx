import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { Chat } from './components/Chat'
import { listFiles, type FileNode } from './lib/api'

function App() {
  const [selectedPath, setSelectedPath] = useState<string | undefined>()

  const { data: files } = useQuery({
    queryKey: ['files', ''],
    queryFn: () => listFiles(''),
  })

  const markdownFiles = useMemo(
    () => (files ?? []).filter((file: FileNode) => !file.is_dir && file.name.endsWith('.md')),
    [files],
  )

  useEffect(() => {
    setSelectedPath(current => {
      if (!markdownFiles.length) return undefined
      const stillExists = current && markdownFiles.some(file => file.path === current)
      if (stillExists) return current
      return markdownFiles[0]?.path
    })
  }, [markdownFiles])

  return (
    <div className="h-full bg-background text-foreground font-display">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={20} minSize={15} className="h-full">
          <Sidebar selectedPath={selectedPath} onSelect={setSelectedPath} />
        </Panel>
        <PanelResizeHandle className="w-px bg-[var(--border-color)] transition-opacity hover:opacity-60" />
        <Panel defaultSize={55} minSize={30} className="h-full">
          <Editor path={selectedPath} onPathChange={setSelectedPath} />
        </Panel>
        <PanelResizeHandle className="w-px bg-[var(--border-color)] transition-opacity hover:opacity-60" />
        <Panel defaultSize={25} minSize={20} className="h-full">
          <Chat path={selectedPath} />
        </Panel>
      </PanelGroup>
    </div>
  )
}

export default App
