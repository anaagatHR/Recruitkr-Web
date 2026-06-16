"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Paperclip, Send, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link, useNavigate } from "@/compat/router";
import { getSession } from "@/lib/auth";
import {
  ChatMessage,
  ConversationSummary,
  fetchConversations,
  fetchThread,
  sendMessage,
} from "@/lib/messages";

const CONVERSATION_POLL_MS = 8000;
const THREAD_POLL_MS = 5000;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const formatTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

const Messages = () => {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationSummary | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Gate the screen behind login.
  useEffect(() => {
    const session = getSession();
    if (!session) {
      navigate("/login?redirect=/messages");
      return;
    }
    setAuthChecked(true);
  }, [navigate]);

  const loadConversations = useCallback(async () => {
    try {
      const list = await fetchConversations();
      setConversations(list);
      setActiveId((prev) => prev ?? list[0]?.id ?? null);
    } catch {
      // Network/auth hiccup — keep whatever we have rather than blanking the UI.
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadThread = useCallback(async (conversationId: string, showSpinner: boolean) => {
    if (showSpinner) setLoadingThread(true);
    try {
      const { conversation, messages: msgs } = await fetchThread(conversationId);
      setActiveConv(conversation);
      setMessages(msgs);
      // Opening clears unread server-side; reflect that locally too.
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)),
      );
    } catch {
      /* leave existing thread in place */
    } finally {
      if (showSpinner) setLoadingThread(false);
    }
  }, []);

  // Poll the conversation list.
  useEffect(() => {
    if (!authChecked) return;
    loadConversations();
    const id = setInterval(loadConversations, CONVERSATION_POLL_MS);
    return () => clearInterval(id);
  }, [authChecked, loadConversations]);

  // Load + poll the active thread.
  useEffect(() => {
    if (!activeId) return;
    loadThread(activeId, true);
    const id = setInterval(() => loadThread(activeId, false), THREAD_POLL_MS);
    return () => clearInterval(id);
  }, [activeId, loadThread]);

  // Keep the thread scrolled to the newest message.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeId]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    if (picked && picked.size > MAX_FILE_BYTES) {
      setError("Files must be 5MB or smaller.");
      e.target.value = "";
      return;
    }
    setError(null);
    setFile(picked);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if ((!text && !file) || !activeId || sending) return;

    setSending(true);
    setError(null);
    try {
      const sent = await sendMessage(activeId, text, file);
      setMessages((prev) => [...prev, sent]);
      setDraft("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Refresh the list ordering/preview.
      loadConversations();
    } catch {
      setError("Could not send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-2 pb-10 pt-24 sm:px-4">
        <div className="mx-auto grid h-[calc(100vh-9rem)] max-w-6xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid-cols-[320px_1fr]">
          {/* Conversation list */}
          <aside
            className={`flex flex-col border-r border-border ${activeId ? "hidden md:flex" : "flex"}`}
          >
            <header className="border-b border-border px-4 py-4">
              <h1 className="text-lg font-bold text-foreground">Messages</h1>
              <p className="text-xs text-muted-foreground">Your applications & conversations</p>
            </header>
            <div className="flex-1 overflow-y-auto">
              {loadingList ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="animate-spin" size={20} />
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No conversations yet. Apply to a job or wait for an employer to reach out.
                  <div className="mt-4">
                    <Link to="/jobs" className="btn-gradient inline-block rounded-lg px-4 py-2 text-sm font-semibold">
                      Browse Jobs
                    </Link>
                  </div>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveId(conv.id)}
                    className={`flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left transition hover:bg-muted/50 ${
                      activeId === conv.id ? "bg-muted/60" : ""
                    }`}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {initialsOf(conv.withName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold text-foreground">{conv.withName}</span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      {conv.jobTitle && (
                        <div className="truncate text-[11px] text-primary">{conv.jobTitle}</div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-muted-foreground">
                          {conv.lastMessage || "Start the conversation"}
                        </span>
                        {conv.unread > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Thread */}
          <section className={`flex flex-col ${activeId ? "flex" : "hidden md:flex"}`}>
            {!activeConv ? (
              <div className="flex flex-1 items-center justify-center px-6 text-center text-muted-foreground">
                Select a conversation to start messaging.
              </div>
            ) : (
              <>
                <header className="flex items-center gap-3 border-b border-border px-4 py-3">
                  <button
                    onClick={() => setActiveId(null)}
                    className="text-muted-foreground md:hidden"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {initialsOf(activeConv.withName)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-bold text-foreground">{activeConv.withName}</div>
                    {activeConv.jobTitle && (
                      <div className="truncate text-xs text-muted-foreground">
                        {activeConv.jobTitle}
                        {activeConv.companyName ? ` · ${activeConv.companyName}` : ""}
                      </div>
                    )}
                  </div>
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 px-4 py-4">
                  {loadingThread ? (
                    <div className="flex justify-center py-10 text-muted-foreground">
                      <Loader2 className="animate-spin" size={20} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      No messages yet. Say hello 👋
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                            msg.mine
                              ? "rounded-br-sm bg-primary text-white"
                              : "rounded-bl-sm border border-border bg-card text-foreground"
                          }`}
                        >
                          {msg.body && <p className="whitespace-pre-wrap break-words">{msg.body}</p>}
                          {msg.attachment && (
                            <a
                              href={msg.attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`mt-1.5 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium underline-offset-2 hover:underline ${
                                msg.mine ? "bg-white/15" : "bg-muted"
                              }`}
                            >
                              <Paperclip size={14} />
                              <span className="truncate">{msg.attachment.name}</span>
                            </a>
                          )}
                          <div
                            className={`mt-1 text-right text-[10px] ${
                              msg.mine ? "text-white/70" : "text-muted-foreground"
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={threadEndRef} />
                </div>

                <form onSubmit={handleSend} className="border-t border-border px-3 py-3">
                  {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
                  {file && (
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs">
                      <Paperclip size={14} />
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="ml-auto text-muted-foreground hover:text-foreground"
                        aria-label="Remove attachment"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg p-2.5 text-muted-foreground transition hover:bg-muted hover:text-primary"
                      aria-label="Attach a file"
                    >
                      <Paperclip size={20} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={onPickFile}
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                    />
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                        }
                      }}
                      rows={1}
                      placeholder="Write a message…"
                      className="max-h-32 flex-1 resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={sending || (!draft.trim() && !file)}
                      className="btn-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-xl disabled:opacity-50"
                      aria-label="Send message"
                    >
                      {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Messages;
