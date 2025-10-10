import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import {
  Code2,
  FileText,
  Image,
  LogIn,
  LogOut,
  MessageCircle,
  Mic,
  Plus,
  Settings,
  UserCircle,
} from 'lucide-react'
import { LandingPage } from './components/LandingPage'
import { WorkspaceView } from './components/WorkspaceView'
import { Sidebar } from './components/Sidebar'
import seastarLogoUrl from './assets/seastar-logo.svg'
import { listFiles, type FileNode } from './lib/api'

type ViewKey = 'ai-chat' | 'ai-notes' | 'ai-voice' | 'ai-code' | 'ai-images'

type MenuItem = {
  key: ViewKey
  label: string
  icon: LucideIcon
  iconClassName: string
}

const menuItems: MenuItem[] = [
  { key: 'ai-notes', label: 'AI Notes', icon: FileText, iconClassName: 'text-blue-500' },
  { key: 'ai-voice', label: 'AI Voice', icon: Mic, iconClassName: 'text-purple-500' },
  { key: 'ai-code', label: 'AI Code', icon: Code2, iconClassName: 'text-green-500' },
  { key: 'ai-images', label: 'AI Images', icon: Image, iconClassName: 'text-pink-500' },
  { key: 'ai-chat', label: 'AI Chat', icon: MessageCircle, iconClassName: 'text-teal-500' },
]

function PlaceholderView({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-text-secondary">{description}</p>
    </div>
  )
}

function App() {
  const [activeView, setActiveView] = useState<ViewKey>('ai-chat')
  const [dropdownOpen, setDropdownOpen] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const [aiNotesSelectedPath, setAiNotesSelectedPath] = useState<string | undefined>()
  const [aiNotesSidebarCollapsed, setAiNotesSidebarCollapsed] = useState(false)

  const profileRef = useRef<HTMLDivElement | null>(null)
  const previousDropdownStateRef = useRef(true)

  const { data: fileTree } = useQuery({
    queryKey: ['files', ''],
    queryFn: () => listFiles(''),
    enabled: activeView === 'ai-notes',
  })

  const markdownFiles = useMemo(
    () => (fileTree ?? []).filter((file: FileNode) => !file.is_dir && file.name.endsWith('.md')),
    [fileTree],
  )

  useEffect(() => {
    if (!profileOpen) return
    const handleClick = (event: MouseEvent) => {
      if (!profileRef.current) return
      if (!profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
    }
  }, [profileOpen])

  useEffect(() => {
    if (activeView !== 'ai-notes') return
    previousDropdownStateRef.current = dropdownOpen
    if (dropdownOpen) {
      setDropdownOpen(false)
    }
  }, [activeView, dropdownOpen])

  useEffect(() => {
    if (activeView === 'ai-notes') return
    setDropdownOpen(previousDropdownStateRef.current)
  }, [activeView])

  useEffect(() => {
    if (activeView !== 'ai-notes') return
    setAiNotesSelectedPath(current => {
      if (!markdownFiles.length) return undefined
      const stillExists = current && markdownFiles.some(file => file.path === current)
      if (stillExists) return current
      return markdownFiles[0]?.path
    })
  }, [activeView, markdownFiles])

  useEffect(() => {
    if (activeView === 'ai-notes') {
      setAiNotesSidebarCollapsed(false)
    }
  }, [activeView])

  const renderActiveView = () => {
    switch (activeView) {
      case 'ai-chat':
        return <LandingPage />
      case 'ai-notes':
        return (
          <WorkspaceView
            integrateSidebar
            selectedPath={aiNotesSelectedPath}
            onSelectedPathChange={setAiNotesSelectedPath}
          />
        )
      case 'ai-voice':
        return (
          <PlaceholderView
            title="AI Voice"
            description="Voice-driven workflows are coming soon. Stay tuned for updates!"
          />
        )
      case 'ai-code':
        return (
          <PlaceholderView
            title="AI Code"
            description="Generate and refactor code with SeaStar. This space is under construction."
          />
        )
      case 'ai-images':
        return (
          <PlaceholderView
            title="AI Images"
            description="Create rich imagery with SeaStar once this feature ships."
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-full bg-background text-foreground font-display">
      <aside className="flex w-60 flex-col border-r border-border-color bg-card-background">
        <div className="flex items-center px-5 py-4">
          <button
            type="button"
            className="flex items-center gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={() => setActiveView('ai-chat')}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border-color bg-card-background">
              <img
                src={seastarLogoUrl}
                alt="SeaStar logo"
                className="h-10 w-10 object-cover"
              />
            </span>
            <span className="text-lg font-semibold">SeaStar</span>
          </button>
        </div>
        <div className="mt-8 px-4">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg bg-primary px-4 py-3 text-white shadow-sm transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={() => setDropdownOpen(prev => !prev)}
            aria-expanded={dropdownOpen}
            aria-controls="main-sidebar-menu"
          >
            <span className="text-sm font-medium uppercase tracking-wide">New Chat</span>
            <Plus className={`h-5 w-5 transition-transform ${dropdownOpen ? 'rotate-45' : ''}`} />
          </button>
          <div
            id="main-sidebar-menu"
            className={`mt-2 space-y-1 overflow-hidden transition-all duration-300 ${
              dropdownOpen ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {menuItems.map(item => {
              const Icon = item.icon
              const isActive = activeView === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveView(item.key)}
                  className={`flex w-full items-center rounded-lg p-3 text-left text-sm font-medium transition ${
                    isActive
                      ? 'bg-gray-100 text-foreground'
                      : 'text-foreground hover:bg-gray-100 hover:text-foreground'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${item.iconClassName}`} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          )
        })}
          </div>
        </div>
        {activeView === 'ai-notes' ? (
          <div className="mt-4 flex-1 overflow-hidden px-4">
            <Sidebar
              variant="embedded"
              className="h-full"
              selectedPath={aiNotesSelectedPath}
              onSelect={path => setAiNotesSelectedPath(path)}
              onCollapse={() => setAiNotesSidebarCollapsed(true)}
              onExpand={() => setAiNotesSidebarCollapsed(false)}
              isCollapsed={aiNotesSidebarCollapsed}
            />
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <div className="px-4 pb-4" ref={profileRef}>
          <div className="relative">
            <button
              type="button"
              className="flex w-full items-center rounded-lg p-3 text-left text-sm font-medium text-foreground transition hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={() => setProfileOpen(prev => !prev)}
              aria-expanded={profileOpen}
              aria-controls="profile-menu"
            >
              <UserCircle className="mr-3 h-6 w-6 text-text-secondary" aria-hidden="true" />
              <span>User Profile</span>
            </button>
            <div
              id="profile-menu"
              className={`absolute left-0 bottom-full mb-2 w-full rounded-lg bg-white py-1 shadow-lg transition-opacity duration-200 ${
                profileOpen ? 'visible opacity-100' : 'invisible opacity-0'
              }`}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition hover:bg-gray-100"
              >
                <LogIn className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                Sign In
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition hover:bg-gray-100"
              >
                <Settings className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                Settings
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex flex-1 overflow-hidden bg-background">{renderActiveView()}</main>
    </div>
  )
}

export default App
