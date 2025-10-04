import { useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { Chat } from './components/Chat'

function App() {
  const [selectedPath, setSelectedPath] = useState<string | undefined>('notes.md')

  return (
    <div className="h-full bg-background text-foreground font-display">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={20} minSize={15} className="h-full">
          <Sidebar selectedPath={selectedPath} onSelect={setSelectedPath} />
        </Panel>
        <PanelResizeHandle className="w-px bg-[var(--border-color)] transition-opacity hover:opacity-60" />
        <Panel defaultSize={55} minSize={30} className="h-full">
          <Editor path={selectedPath} />
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
