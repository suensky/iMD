import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from "react-resizable-panels";
import { Sidebar } from "./Sidebar";
import { Editor } from "./Editor";
import { Chat } from "./Chat";
import { listFiles, type FileNode } from "../lib/api";

type WorkspaceViewProps = {
  integrateSidebar?: boolean;
  selectedPath?: string;
  onSelectedPathChange?: (next: string | undefined) => void;
};

export function WorkspaceView({
  integrateSidebar = false,
  selectedPath,
  onSelectedPathChange,
}: WorkspaceViewProps) {
  const isControlled =
    integrateSidebar && typeof onSelectedPathChange === "function";
  const [internalSelectedPath, setInternalSelectedPath] = useState<
    string | undefined
  >();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);
  const chatPanelRef = useRef<ImperativePanelHandle>(null);

  const shouldQueryFiles = !integrateSidebar;
  const { data: files } = useQuery({
    queryKey: ["files", ""],
    queryFn: () => listFiles(""),
    enabled: shouldQueryFiles,
  });

  const markdownFiles = useMemo(() => {
    if (!files) return [];
    return (files ?? []).filter(
      (file: FileNode) => !file.is_dir && file.name.endsWith(".md"),
    );
  }, [files]);

  const effectiveSelectedPath = isControlled
    ? selectedPath
    : internalSelectedPath;

  useEffect(() => {
    if (integrateSidebar) return;
    setInternalSelectedPath((current) => {
      if (!markdownFiles.length) return undefined;
      const stillExists =
        current && markdownFiles.some((file) => file.path === current);
      if (stillExists) return current;
      return markdownFiles[0]?.path;
    });
  }, [integrateSidebar, markdownFiles]);

  const updateSelectedPath = (next: string | undefined) => {
    if (isControlled) {
      onSelectedPathChange?.(next);
    } else {
      setInternalSelectedPath(next);
    }
  };

  useEffect(() => {
    if (!integrateSidebar) return;
    // Keep internal state in sync when controlled
    setInternalSelectedPath(selectedPath);
  }, [integrateSidebar, selectedPath]);

  const collapseSidebar = () => {
    if (integrateSidebar) return;
    sidebarPanelRef.current?.collapse();
    setIsSidebarCollapsed(true);
  };

  const expandSidebar = () => {
    if (integrateSidebar) return;
    sidebarPanelRef.current?.expand();
    setIsSidebarCollapsed(false);
  };

  const collapseChat = () => {
    chatPanelRef.current?.collapse();
    setIsChatCollapsed(true);
  };

  const expandChat = () => {
    chatPanelRef.current?.expand();
    setIsChatCollapsed(false);
  };

  return (
    <div className="flex h-full w-full flex-col bg-page text-foreground">
      <PanelGroup direction="horizontal" className="flex h-full">
        {!integrateSidebar && (
          <>
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
                selectedPath={effectiveSelectedPath}
                onSelect={(path) => updateSelectedPath(path)}
                onCollapse={collapseSidebar}
                onExpand={expandSidebar}
                isCollapsed={isSidebarCollapsed}
              />
            </Panel>
            <PanelResizeHandle className="relative flex w-px items-stretch bg-border-color transition hover:bg-border-strong" />
          </>
        )}
        <Panel defaultSize={55} minSize={30} className="h-full">
          <Editor
            path={effectiveSelectedPath}
            onPathChange={updateSelectedPath}
          />
        </Panel>
        <PanelResizeHandle className="relative flex w-px items-stretch bg-border-color transition hover:bg-border-strong" />
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
            path={effectiveSelectedPath}
            onCollapse={collapseChat}
            onExpand={expandChat}
            isCollapsed={isChatCollapsed}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}
