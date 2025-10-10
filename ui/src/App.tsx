import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from "react-resizable-panels";
import type { LucideIcon } from "lucide-react";
import {
  ChevronLeft,
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
} from "lucide-react";
import { LandingPage } from "./components/LandingPage";
import { WorkspaceView } from "./components/WorkspaceView";
import { Sidebar } from "./components/Sidebar";
import seastarLogoUrl from "./assets/seastar-logo.svg";
import { listFiles, type FileNode } from "./lib/api";
import { Tooltip } from "./components/Tooltip";

type ViewKey = "ai-chat" | "ai-notes" | "ai-voice" | "ai-code" | "ai-images";

type MenuItem = {
  key: ViewKey;
  label: string;
  icon: LucideIcon;
  iconClassName: string;
};

const menuItems: MenuItem[] = [
  {
    key: "ai-notes",
    label: "AI Notes",
    icon: FileText,
    iconClassName: "text-blue-500",
  },
  {
    key: "ai-voice",
    label: "AI Voice",
    icon: Mic,
    iconClassName: "text-purple-500",
  },
  {
    key: "ai-code",
    label: "AI Code",
    icon: Code2,
    iconClassName: "text-green-500",
  },
  {
    key: "ai-images",
    label: "AI Images",
    icon: Image,
    iconClassName: "text-pink-500",
  },
  {
    key: "ai-chat",
    label: "AI Chat",
    icon: MessageCircle,
    iconClassName: "text-teal-500",
  },
];

function PlaceholderView({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-text-secondary">{description}</p>
    </div>
  );
}

function App() {
  const [activeView, setActiveView] = useState<ViewKey>("ai-chat");
  const [dropdownOpen, setDropdownOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aiNotesSelectedPath, setAiNotesSelectedPath] = useState<
    string | undefined
  >();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const sidebarPanelRef = useRef<ImperativePanelHandle | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const previousDropdownStateRef = useRef(true);

  const { data: fileTree } = useQuery({
    queryKey: ["files", ""],
    queryFn: () => listFiles(""),
    enabled: activeView === "ai-notes",
  });

  const markdownFiles = useMemo(
    () =>
      (fileTree ?? []).filter(
        (file: FileNode) => !file.is_dir && file.name.endsWith(".md"),
      ),
    [fileTree],
  );

  const isNotesView = activeView === "ai-notes";
  const shouldShowNewChat = activeView === "ai-chat";
  const menuExpanded = shouldShowNewChat && dropdownOpen;

  const toggleSidebar = () => {
    if (isSidebarCollapsed) {
      sidebarPanelRef.current?.expand();
    } else {
      sidebarPanelRef.current?.collapse();
    }
  };

  const collapseLabel = isSidebarCollapsed
    ? "Expand sidebar"
    : "Collapse sidebar";
  const headerClassName = isSidebarCollapsed
    ? "flex items-center justify-center px-3 py-5"
    : "flex items-center justify-between border-b border-border-color px-5 py-5";

  useEffect(() => {
    if (!profileOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [profileOpen]);

  useEffect(() => {
    if (shouldShowNewChat) {
      setDropdownOpen(previousDropdownStateRef.current);
      return;
    }
    previousDropdownStateRef.current = dropdownOpen;
  }, [shouldShowNewChat, dropdownOpen]);

  useEffect(() => {
    if (!isNotesView) return;
    setAiNotesSelectedPath((current) => {
      if (!markdownFiles.length) return undefined;
      const stillExists =
        current && markdownFiles.some((file) => file.path === current);
      if (stillExists) return current;
      return markdownFiles[0]?.path;
    });
  }, [isNotesView, markdownFiles]);

  const handleLogoClick = () => {
    if (isSidebarCollapsed) {
      sidebarPanelRef.current?.expand();
      return;
    }
    setActiveView("ai-chat");
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "ai-chat":
        return <LandingPage />;
      case "ai-notes":
        return (
          <WorkspaceView
            integrateSidebar
            selectedPath={aiNotesSelectedPath}
            onSelectedPathChange={setAiNotesSelectedPath}
          />
        );
      case "ai-voice":
        return (
          <PlaceholderView
            title="AI Voice"
            description="Voice-driven workflows are coming soon. Stay tuned for updates!"
          />
        );
      case "ai-code":
        return (
          <PlaceholderView
            title="AI Code"
            description="Generate and refactor code with SeaStar. This space is under construction."
          />
        );
      case "ai-images":
        return (
          <PlaceholderView
            title="AI Images"
            description="Create rich imagery with SeaStar once this feature ships."
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full bg-page text-foreground font-display">
      <PanelGroup direction="horizontal" className="flex h-full w-full">
        <Panel
          ref={sidebarPanelRef}
          collapsible
          defaultSize={24}
          minSize={0}
          // @ts-expect-error: react-resizable-panels supports minSizePx although typings lag behind.
          minSizePx={180}
          maxSize={40}
          collapsedSize={3.5}
          onCollapse={() => setIsSidebarCollapsed(true)}
          onExpand={() => setIsSidebarCollapsed(false)}
          className="h-full"
        >
          <aside className="flex h-full flex-col border-r border-border-color bg-surface">
            <div className={headerClassName}>
              <button
                type="button"
                className={`flex items-center gap-3 rounded-xl px-2 py-1 text-left transition hover:bg-surface-muted focus-visible:shadow-ring focus-visible:outline-none ${isSidebarCollapsed ? "justify-center" : ""}`}
                onClick={handleLogoClick}
              >
                <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-border-color bg-surface-muted">
                  <img
                    src={seastarLogoUrl}
                    alt="SeaStar logo"
                    className="h-10 w-10 object-cover"
                  />
                </span>
                {!isSidebarCollapsed && (
                  <span className="flex flex-col">
                    <span className="text-base font-semibold leading-tight">
                      SeaStar
                    </span>
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-text-tertiary">
                      Studio
                    </span>
                  </span>
                )}
              </button>
              {!isSidebarCollapsed && (
                <Tooltip label={collapseLabel}>
                  <button
                    type="button"
                    aria-label={collapseLabel}
                    className="rounded-full border border-border-color p-2 text-text-secondary transition hover:bg-surface-muted hover:text-foreground focus-visible:shadow-ring focus-visible:outline-none"
                    onClick={toggleSidebar}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                </Tooltip>
              )}
            </div>
            {shouldShowNewChat && (
              <div className={`${isSidebarCollapsed ? "px-3" : "px-5"} mt-3`}>
                {isSidebarCollapsed ? (
                  <Tooltip label={dropdownOpen ? "Close menu" : "Open menu"}>
                    <button
                      type="button"
                      className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-white shadow-soft transition hover:bg-primary-hover focus-visible:shadow-ring focus-visible:outline-none"
                      onClick={() => setDropdownOpen((prev) => !prev)}
                      aria-label={dropdownOpen ? "Close menu" : "Open menu"}
                      aria-expanded={dropdownOpen}
                      aria-controls="main-sidebar-menu"
                    >
                      <Plus
                        className={`h-5 w-5 transition-transform ${dropdownOpen ? "rotate-45" : ""}`}
                      />
                    </button>
                  </Tooltip>
                ) : (
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl bg-primary px-5 py-4 text-white shadow-soft transition hover:bg-primary-hover focus-visible:shadow-ring focus-visible:outline-none"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    aria-expanded={dropdownOpen}
                    aria-controls="main-sidebar-menu"
                  >
                    <span className="text-sm font-semibold uppercase tracking-[0.2em]">
                      New Chat
                    </span>
                    <Plus
                      className={`h-5 w-5 transition-transform ${dropdownOpen ? "rotate-45" : ""}`}
                    />
                  </button>
                )}
              </div>
            )}
            {menuExpanded && (
              <div className={`${isSidebarCollapsed ? "px-3" : "px-5"} mt-3`}>
                <nav
                  id="main-sidebar-menu"
                  className={`flex flex-col ${isSidebarCollapsed ? "items-center gap-2.5" : "gap-2"}`}
                >
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.key;
                    const baseClasses =
                      "flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition focus-visible:shadow-ring focus-visible:outline-none";
                    const stateClasses = isActive
                      ? "bg-primary-soft text-primary shadow-soft"
                      : "text-text-secondary hover:bg-surface-muted hover:text-foreground";
                    const layoutClasses = isSidebarCollapsed
                      ? "justify-center"
                      : "justify-start text-left";
                    if (isSidebarCollapsed) {
                      return (
                        <Tooltip key={item.key} label={item.label}>
                          <button
                            type="button"
                            onClick={() => setActiveView(item.key)}
                            aria-label={item.label}
                            className={`${baseClasses} ${stateClasses} ${layoutClasses}`}
                          >
                            <Icon
                              className={`h-5 w-5 ${item.iconClassName}`}
                              aria-hidden="true"
                            />
                          </button>
                        </Tooltip>
                      );
                    }
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveView(item.key)}
                        className={`${baseClasses} ${stateClasses} ${layoutClasses}`}
                      >
                        <Icon
                          className={`mr-3 h-5 w-5 ${item.iconClassName}`}
                          aria-hidden="true"
                        />
                        <span className="tracking-wide">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}
            <div className="flex flex-1 flex-col">
              {isNotesView ? (
                <div
                  className={`${isSidebarCollapsed ? "px-2" : "px-5"} mt-4 flex-1 overflow-hidden pb-4`}
                >
                  <Sidebar
                    variant="embedded"
                    className="h-full"
                    selectedPath={aiNotesSelectedPath}
                    onSelect={(path) => setAiNotesSelectedPath(path)}
                    isCollapsed={isSidebarCollapsed}
                    showCollapseControl={false}
                  />
                </div>
              ) : (
                <div className="flex-1" />
              )}
            </div>
            <div
              className={`${isSidebarCollapsed ? "px-3" : "px-5"} pb-6`}
              ref={profileRef}
            >
              <div className="relative">
                {isSidebarCollapsed ? (
                  <Tooltip label="User Profile">
                    <button
                      type="button"
                      className="flex h-12 w-full items-center justify-center rounded-xl p-2 text-sm text-text-secondary transition hover:bg-surface-muted hover:text-foreground focus-visible:shadow-ring focus-visible:outline-none"
                      onClick={() => setProfileOpen((prev) => !prev)}
                      aria-label="User Profile"
                      aria-expanded={profileOpen}
                      aria-controls="profile-menu"
                    >
                      <UserCircle
                        className="h-6 w-6 text-text-secondary"
                        aria-hidden="true"
                      />
                    </button>
                  </Tooltip>
                ) : (
                  <button
                    type="button"
                    className="flex w-full items-center rounded-xl px-4 py-3 text-left text-sm font-medium text-foreground transition hover:bg-surface-muted focus-visible:shadow-ring focus-visible:outline-none"
                    onClick={() => setProfileOpen((prev) => !prev)}
                    aria-expanded={profileOpen}
                    aria-controls="profile-menu"
                  >
                    <UserCircle
                      className="mr-3 h-6 w-6 text-text-secondary"
                      aria-hidden="true"
                    />
                    <span>User Profile</span>
                  </button>
                )}
                <div
                  id="profile-menu"
                  className={`absolute bottom-full mb-3 rounded-xl border border-border-color bg-surface-elevated py-1 shadow-soft transition-opacity duration-200 ${
                    profileOpen ? "visible opacity-100" : "invisible opacity-0"
                  } ${isSidebarCollapsed ? "left-1/2 w-48 -translate-x-1/2" : "left-0 w-full"}`}
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-secondary transition hover:bg-surface-muted hover:text-foreground"
                  >
                    <LogIn
                      className="h-4 w-4 text-text-secondary"
                      aria-hidden="true"
                    />
                    Sign In
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-secondary transition hover:bg-surface-muted hover:text-foreground"
                  >
                    <Settings
                      className="h-4 w-4 text-text-secondary"
                      aria-hidden="true"
                    />
                    Settings
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-secondary transition hover:bg-surface-muted hover:text-foreground"
                  >
                    <LogOut
                      className="h-4 w-4 text-text-secondary"
                      aria-hidden="true"
                    />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </Panel>
        <PanelResizeHandle className="relative flex w-px items-stretch bg-border-color transition hover:bg-border-strong">
          <span className="pointer-events-none absolute inset-y-0 -left-1 w-0.5 rounded-full bg-transparent" />
        </PanelResizeHandle>
        <Panel defaultSize={76} minSize={40} className="h-full">
          <main className="flex h-full flex-1 overflow-hidden bg-page">
            {renderActiveView()}
          </main>
        </Panel>
      </PanelGroup>
    </div>
  );
}

export default App;
