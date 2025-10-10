import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax";
import {
  Eye,
  FilePlus,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Save as SaveIcon,
} from "lucide-react";
import { readFile, writeFile } from "../lib/api";
import {
  remarkDefinitionLists,
  remarkEmoji,
  remarkLineBlocks,
  remarkPandocTables,
  remarkSubSuperscript,
  remarkSmartPunctuation,
} from "../lib/markdownPlugins";
import type { Components } from "react-markdown";
import { Tooltip } from "./Tooltip";

const MIN_SPLIT_RATIO = 0.2;
const MAX_SPLIT_RATIO = 0.8;
const SPLIT_STORAGE_KEY = "editor.split.ratio";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const markdownComponents: Components = {
  a: (props) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="markdown-link"
    />
  ),
  code: ({ inline, className, children, ...props }: any) => {
    const language = /language-(\w+)/.exec(className ?? "")?.[1];

    if (inline) {
      return (
        <code className="markdown-code-inline" {...props}>
          {children}
        </code>
      );
    }

    return (
      <pre className="markdown-code-block" data-language={language}>
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    );
  },
  table: ({ node, ...props }: any) => {
    const caption =
      typeof node?.data?.caption === "string" ? node.data.caption : undefined;
    const table = <table {...props} />;
    if (!caption) return table;
    return (
      <figure className="markdown-table-wrapper">
        {table}
        <figcaption className="markdown-table-caption">{caption}</figcaption>
      </figure>
    );
  },
};

type EditorProps = {
  path?: string;
  onPathChange?: (next: string) => void;
};

type EditorViewRef = {
  scrollDOM: HTMLElement;
};

type PreviewMode = "editor" | "split" | "preview";
const previewModeOrder: PreviewMode[] = ["editor", "split", "preview"];
const previewModeLabels: Record<PreviewMode, string> = {
  editor: "Editor only",
  split: "Split view",
  preview: "Preview only",
};

export function Editor({ path, onPathChange }: EditorProps) {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["file", path],
    queryFn: () => {
      if (!path) throw new Error("No file selected");
      return readFile(path);
    },
    enabled: !!path,
  });

  const [content, setContent] = useState("");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("editor");
  const [editorView, setEditorView] = useState<EditorViewRef | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const scrollSyncLockRef = useRef<"editor" | "preview" | null>(null);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);

  const [splitRatio, setSplitRatio] = useState(0.5);
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(SPLIT_STORAGE_KEY);
      if (!stored) return;
      const parsed = Number.parseFloat(stored);
      if (Number.isFinite(parsed)) {
        setSplitRatio(clamp(parsed, MIN_SPLIT_RATIO, MAX_SPLIT_RATIO));
      }
    } catch (err) {
      console.warn("Failed to load stored split ratio", err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SPLIT_STORAGE_KEY, splitRatio.toString());
    } catch (err) {
      console.warn("Failed to persist split ratio", err);
    }
  }, [splitRatio]);

  useEffect(() => {
    if (!isDraggingDivider) return;
    const container = splitContainerRef.current;
    if (!container) return;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0) return;
      const ratio = (event.clientX - rect.left) / rect.width;
      setSplitRatio(clamp(ratio, MIN_SPLIT_RATIO, MAX_SPLIT_RATIO));
    };

    const handlePointerUp = () => {
      setIsDraggingDivider(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [isDraggingDivider]);

  useEffect(() => {
    if (previewMode !== "split" && isDraggingDivider) {
      setIsDraggingDivider(false);
    }
  }, [previewMode, isDraggingDivider]);

  const handleDividerPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (previewMode !== "split") return;
    event.preventDefault();
    setIsDraggingDivider(true);
    event.currentTarget.focus();
  };

  const adjustSplitRatio = (delta: number) => {
    setSplitRatio((prev) =>
      clamp(prev + delta, MIN_SPLIT_RATIO, MAX_SPLIT_RATIO),
    );
  };

  const handleDividerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (previewMode !== "split") return;
    const step = 0.02;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      adjustSplitRatio(-step);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      adjustSplitRatio(step);
    } else if (event.key === "Home") {
      event.preventDefault();
      setSplitRatio(MIN_SPLIT_RATIO);
    } else if (event.key === "End") {
      event.preventDefault();
      setSplitRatio(MAX_SPLIT_RATIO);
    }
  };

  useEffect(() => {
    setContent(data?.content ?? "");
  }, [data?.content]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!path) return;
      return writeFile(path, content);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["file", path] });
      qc.invalidateQueries({ queryKey: ["files"] });
      qc.invalidateQueries({ queryKey: ["files", ""] });
    },
    onError: (err) => {
      console.error(err);
      window.alert("Failed to save file. Please try again.");
    },
  });

  const saveAsMut = useMutation({
    mutationFn: async (nextPath: string) => {
      await writeFile(nextPath, content);
      return nextPath;
    },
    onSuccess: (nextPath) => {
      qc.invalidateQueries({ queryKey: ["file", path] });
      qc.invalidateQueries({ queryKey: ["file", nextPath] });
      qc.invalidateQueries({ queryKey: ["files"] });
      qc.invalidateQueries({ queryKey: ["files", ""] });
      onPathChange?.(nextPath);
    },
    onError: (err) => {
      console.error(err);
      window.alert(
        "Failed to save file. Please try again with a different name or location.",
      );
    },
  });

  const extensions = useMemo(() => [markdown()], []);
  const previewPlugins = useMemo(
    () => [
      remarkGfm,
      remarkMath,
      remarkPandocTables,
      remarkDefinitionLists,
      remarkLineBlocks,
      remarkSubSuperscript,
      remarkEmoji,
      remarkSmartPunctuation,
    ],
    [],
  );
  const previewRehypePlugins = useMemo(() => [rehypeMathjax], []);

  const isDirty = content !== (data?.content ?? "");

  useEffect(() => {
    if (previewMode !== "split") return;

    const editorScrollEl = editorView?.scrollDOM;
    const previewScrollEl = previewRef.current;

    if (!editorScrollEl || !previewScrollEl) return;

    let frame: number | null = null;

    const syncScroll = (source: "editor" | "preview") => {
      const from = source === "editor" ? editorScrollEl : previewScrollEl;
      const to = source === "editor" ? previewScrollEl : editorScrollEl;

      if (!to) return;
      if (scrollSyncLockRef.current && scrollSyncLockRef.current !== source)
        return;

      const fromScrollable = from.scrollHeight - from.clientHeight;
      const toScrollable = to.scrollHeight - to.clientHeight;

      if (fromScrollable <= 0 || toScrollable <= 0) return;

      const ratio = from.scrollTop / fromScrollable;

      scrollSyncLockRef.current = source;

      if (frame) cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        to.scrollTop = ratio * toScrollable;
        scrollSyncLockRef.current = null;
      });
    };

    const handleEditorScroll = () => syncScroll("editor");
    const handlePreviewScroll = () => syncScroll("preview");

    editorScrollEl.addEventListener("scroll", handleEditorScroll);
    previewScrollEl.addEventListener("scroll", handlePreviewScroll);

    syncScroll("editor");

    return () => {
      editorScrollEl.removeEventListener("scroll", handleEditorScroll);
      previewScrollEl.removeEventListener("scroll", handlePreviewScroll);
      if (frame) cancelAnimationFrame(frame);
      scrollSyncLockRef.current = null;
    };
  }, [editorView, previewMode]);

  const handleSave = () => {
    if (!path || !isDirty) return;
    saveMut.mutate();
  };

  const handleSaveAs = () => {
    const suggested = path ?? "untitled.md";
    const input = window.prompt("Save file as", suggested);
    if (!input) return;
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!trimmed.endsWith(".md")) {
      window.alert('Filename must end with ".md"');
      return;
    }
    if (trimmed === path) {
      handleSave();
      return;
    }
    saveAsMut.mutate(trimmed);
  };

  if (!path) return <div className="h-full bg-surface" />;
  if (isLoading)
    return <div className="p-4 text-sm text-text-secondary">Loading...</div>;
  if (error)
    return <div className="p-4 text-sm text-red-500">Failed to load file.</div>;

  const cyclePreviewMode = () => {
    setPreviewMode((prev) => {
      const idx = previewModeOrder.indexOf(prev);
      const nextIdx = (idx + 1) % previewModeOrder.length;
      return previewModeOrder[nextIdx];
    });
  };

  const nextMode =
    previewModeOrder[
      (previewModeOrder.indexOf(previewMode) + 1) % previewModeOrder.length
    ];

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center gap-2 border-b border-border-color bg-surface px-4 py-3">
        <div className="flex-1 truncate text-xs uppercase tracking-[0.18em] text-text-tertiary">
          {path}
        </div>
        <Tooltip label="Save changes">
          <button
            type="button"
            className={`flex items-center justify-center rounded-lg p-2 text-sm font-medium transition focus-visible:shadow-ring focus-visible:outline-none disabled:opacity-60 ${
              isDirty
                ? "bg-primary text-white shadow-soft hover:bg-primary-hover"
                : "border border-border-color text-text-secondary hover:bg-surface-muted hover:text-foreground"
            }`}
            onClick={handleSave}
            disabled={!isDirty || saveMut.isPending || saveAsMut.isPending}
            aria-label="Save file"
          >
            {saveMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <SaveIcon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </Tooltip>
        <Tooltip label="Save as new file">
          <button
            type="button"
            className="flex items-center justify-center rounded-lg border border-border-color p-2 text-text-secondary transition hover:bg-surface-muted hover:text-foreground focus-visible:shadow-ring focus-visible:outline-none disabled:opacity-60"
            onClick={handleSaveAs}
            disabled={saveAsMut.isPending || saveMut.isPending}
            aria-label="Save file as"
          >
            {saveAsMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <FilePlus className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </Tooltip>
        <Tooltip
          label={`Current: ${previewModeLabels[previewMode]}. Next: ${previewModeLabels[nextMode]}`}
        >
          <button
            className="flex items-center justify-center rounded-lg border border-border-color p-2 text-text-secondary transition hover:bg-surface-muted hover:text-foreground focus-visible:shadow-ring focus-visible:outline-none"
            onClick={cyclePreviewMode}
            aria-label={`Change view (current: ${previewModeLabels[previewMode]})`}
          >
            {previewMode === "editor" ? (
              <PanelRightOpen className="h-4 w-4" aria-hidden="true" />
            ) : previewMode === "split" ? (
              <PanelRightClose className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </Tooltip>
      </div>
      <div ref={splitContainerRef} className="flex-1 min-h-0 flex bg-surface">
        {previewMode !== "preview" ? (
          <div
            className={`flex-1 min-w-0 h-full ${
              previewMode === "split" ? "border-r border-border-color" : ""
            }`}
            style={
              previewMode === "split"
                ? {
                    flexBasis: `${splitRatio * 100}%`,
                    flexGrow: 0,
                    flexShrink: 0,
                  }
                : undefined
            }
          >
            <CodeMirror
              value={content}
              height="100%"
              basicSetup={{ lineNumbers: true }}
              extensions={extensions}
              onChange={setContent}
              onCreateEditor={(view) => setEditorView(view as EditorViewRef)}
              theme="light"
              className="h-full bg-surface"
            />
          </div>
        ) : null}
        {previewMode === "split" ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={Math.round(splitRatio * 100)}
            aria-valuemin={Math.round(MIN_SPLIT_RATIO * 100)}
            aria-valuemax={Math.round(MAX_SPLIT_RATIO * 100)}
            tabIndex={0}
            className={`flex w-2 cursor-col-resize items-stretch justify-center bg-transparent ${
              isDraggingDivider ? "bg-primary-soft" : ""
            }`}
            onPointerDown={handleDividerPointerDown}
            onKeyDown={handleDividerKeyDown}
          >
            <div className="h-full w-px bg-border-color" />
          </div>
        ) : null}
        {previewMode !== "editor" ? (
          <div
            ref={previewRef}
            className={`flex-1 min-w-0 h-full overflow-auto p-4 text-foreground ${
              previewMode === "preview" ? "border-0" : ""
            }`}
            style={
              previewMode === "split"
                ? {
                    flexBasis: `${(1 - splitRatio) * 100}%`,
                    flexGrow: 0,
                    flexShrink: 0,
                  }
                : undefined
            }
          >
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={previewPlugins}
                rehypePlugins={previewRehypePlugins}
                components={markdownComponents}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
