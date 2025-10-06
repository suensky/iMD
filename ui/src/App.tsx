import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { Chat } from './components/Chat'
import { listFiles, type FileNode } from './lib/api'

function App() {
  const [selectedPath, setSelectedPath] = useState<string | undefined>()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isChatCollapsed, setIsChatCollapsed] = useState(false)

  const sidebarPanelRef = useRef<ImperativePanelHandle>(null)
  const chatPanelRef = useRef<ImperativePanelHandle>(null)

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

  const collapseSidebar = () => {
    sidebarPanelRef.current?.collapse()
    setIsSidebarCollapsed(true)
  }

  const expandSidebar = () => {
    sidebarPanelRef.current?.expand()
    setIsSidebarCollapsed(false)
  }

  const collapseChat = () => {
    chatPanelRef.current?.collapse()
    setIsChatCollapsed(true)
  }

  const expandChat = () => {
    chatPanelRef.current?.expand()
    setIsChatCollapsed(false)
  }

  return (
    <div className="h-full bg-background text-foreground font-display">
      <PanelGroup direction="horizontal" className="h-full">
        <Panel
          ref={sidebarPanelRef}
          defaultSize={20}
          minSize={15}
          collapsible
          collapsedSize={3}
          onCollapse={() => setIsSidebarCollapsed(true)}
          onExpand={() => setIsSidebarCollapsed(false)}
          className="h-full"
        >
          <Sidebar
            selectedPath={selectedPath}
            onSelect={setSelectedPath}
            onCollapse={collapseSidebar}
            onExpand={expandSidebar}
            isCollapsed={isSidebarCollapsed}
          />
        </Panel>
        <PanelResizeHandle className="w-px bg-[var(--border-color)] transition-opacity hover:opacity-60" />
        <Panel defaultSize={55} minSize={30} className="h-full">
          <Editor path={selectedPath} onPathChange={setSelectedPath} />
        </Panel>
        <PanelResizeHandle className="w-px bg-[var(--border-color)] transition-opacity hover:opacity-60" />
        <Panel
          ref={chatPanelRef}
          defaultSize={25}
          minSize={20}
          collapsible
          collapsedSize={3}
          onCollapse={() => setIsChatCollapsed(true)}
          onExpand={() => setIsChatCollapsed(false)}
          className="h-full"
        >
          <Chat
            path={selectedPath}
            onCollapse={collapseChat}
            onExpand={expandChat}
            isCollapsed={isChatCollapsed}
          />
        </Panel>
      </PanelGroup>
    </div>
  )
}

export default App
