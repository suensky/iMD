import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Camera, Info, Mic, Send } from "lucide-react";

type LandingMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const createId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

export function LandingPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<LandingMessage[]>(() => [
    {
      id: createId(),
      role: "assistant",
      text: "Hi there! I'm SeaStar — ask anything or describe what you would like me to create.",
    },
  ]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const hasInput = input.trim().length > 0;

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [input]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasInput) return;
    const trimmed = input.trim();
    const userEntry: LandingMessage = {
      id: createId(),
      role: "user",
      text: trimmed,
    };
    const assistantEntry: LandingMessage = {
      id: createId(),
      role: "assistant",
      text: "I'm ready to help — integrations with workspace tools are coming soon!",
    };
    setMessages((prev) => [...prev, userEntry, assistantEntry]);
    setInput("");
  };

  const renderedMessages = useMemo(
    () =>
      messages.map((message) => {
        const isUser = message.role === "user";
        return (
          <div
            key={message.id}
            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                isUser
                  ? "bg-primary text-white shadow-soft"
                  : "border border-border-color bg-surface-muted text-foreground shadow-sm"
              }`}
            >
              {message.text}
            </div>
          </div>
        );
      }),
    [messages],
  );

  const quickStarts = [
    {
      title: "Summarize research",
      detail: "Turn raw interview notes into a polished brief with next steps.",
    },
    {
      title: "Launch prep",
      detail:
        "Draft product announcements and checklists from scattered thoughts.",
    },
    {
      title: "Team sync",
      detail: "Transform meeting transcripts into action-oriented recaps.",
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <section className="border-b border-border-color bg-surface px-6 py-10 md:px-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-5">
            <span className="inline-flex w-fit items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              SeaStar AI
            </span>
            <h1 className="text-4xl font-bold leading-[1.05] text-foreground md:text-5xl">
              Craft beautiful notes with an AI coauthor by your side.
            </h1>
            <p className="max-w-xl text-base text-text-secondary md:text-lg">
              Start with a spark, iterate with intelligent prompts, and stay in
              flow from first idea to published doc.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-hover focus-visible:shadow-ring focus-visible:outline-none"
                onClick={() => textareaRef.current?.focus()}
              >
                Start writing
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-border-color px-5 py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-surface-muted hover:text-foreground focus-visible:shadow-ring focus-visible:outline-none"
                onClick={() => {
                  setInput(
                    "Draft a crisp launch announcement for the new workspace.",
                  );
                  textareaRef.current?.focus();
                }}
              >
                Try a prompt
              </button>
            </div>
          </div>
          <div className="w-full max-w-sm space-y-4 rounded-3xl border border-border-color bg-surface-muted p-6 text-sm text-text-secondary shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Info className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Live collaboration
                </p>
                <p className="text-xs text-text-tertiary">
                  Invite team members to coedit in real time.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Mic className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Voice capture
                </p>
                <p className="text-xs text-text-tertiary">
                  Transcribe audio snippets directly into notes.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Camera className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Visual context
                </p>
                <p className="text-xs text-text-tertiary">
                  Attach screenshots and diagrams to enrich drafts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="flex-1 overflow-y-auto bg-page px-4 py-8 md:px-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:flex-row">
          <div className="flex flex-1 flex-col rounded-3xl border border-border-color bg-surface shadow-soft">
            <div className="flex items-center justify-between gap-3 border-b border-border-color px-6 py-4">
              <div>
                <p className="text-sm font-semibold">SeaStar Canvas</p>
                <p className="text-xs text-text-tertiary">
                  Experiment with ideas before saving to workspace.
                </p>
              </div>
              <span className="rounded-full border border-border-color px-3 py-1 text-xs font-medium text-text-secondary">
                Autosave preview
              </span>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              {renderedMessages}
            </div>
            <div className="border-t border-border-color px-6 py-5">
              <form className="space-y-3" onSubmit={handleSubmit}>
                <div className="relative rounded-3xl border border-border-color bg-surface-muted px-4 py-3 shadow-sm transition focus-within:border-primary focus-within:shadow-ring">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder="Ask anything, create anything"
                    className="max-h-40 min-h-[28px] w-full resize-none bg-transparent pr-28 text-sm leading-6 text-foreground placeholder:text-text-tertiary focus:outline-none"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                  />
                  <div className="pointer-events-none absolute bottom-2.5 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      className="pointer-events-auto rounded-full p-2 text-text-secondary transition hover:text-primary focus-visible:shadow-ring focus-visible:outline-none"
                      aria-label="Record audio"
                    >
                      <Mic className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="pointer-events-auto rounded-full p-2 text-text-secondary transition hover:text-primary focus-visible:shadow-ring focus-visible:outline-none"
                      aria-label="Attach media"
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                    <button
                      type="submit"
                      disabled={!hasInput}
                      className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full transition ${
                        hasInput
                          ? "bg-primary text-white hover:bg-primary-hover"
                          : "bg-border-color text-text-secondary"
                      }`}
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-text-tertiary">
                  Press Enter to send, Shift+Enter for a new line.
                </p>
              </form>
            </div>
          </div>
          <aside className="w-full max-w-sm space-y-4">
            <div className="rounded-3xl border border-border-color bg-surface shadow-soft p-6">
              <h2 className="text-base font-semibold text-foreground">
                Quick starts
              </h2>
              <ul className="mt-4 space-y-4 text-sm text-text-secondary">
                {quickStarts.map((item) => (
                  <li
                    key={item.title}
                    className="rounded-2xl border border-border-color bg-surface-muted p-4"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-text-tertiary">
                      {item.detail}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-dashed border-border-color bg-surface-muted p-6 text-sm text-text-secondary">
              <p className="font-semibold text-foreground">Workspace aware</p>
              <p className="mt-2 text-xs leading-relaxed text-text-tertiary">
                SeaStar connects to docs, slides, and wikis so the assistant
                always responds with the right context. Link additional sources
                from settings to boost accuracy.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
