"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CalendarPlus,
  Check,
  CheckCheck,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Info,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Mic,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Square,
  Trash2,
  Video,
  X,
} from "lucide-react";



import { Link, useLocation, useNavigate } from "@/compat/router";
import { cn } from "@/lib/utils";
import { getSession } from "@/lib/auth";
import { useServerEvents } from "@/hooks/useServerEvents";
import {
  ApplicationStatus,
  ChatMessage,
  ConversationSummary,
  fetchConversations,
  fetchThread,
  markConversationRead,
  openConversation,
  scheduleInterview,
  sendMessage,
  sendTyping,
} from "@/lib/messages";

const INTERVIEW_MODE_OPTIONS = [
  { value: "video", label: "Video call" },
  { value: "google-meet", label: "Google Meet" },
  { value: "zoom", label: "Zoom" },
  { value: "phone", label: "Phone" },
  { value: "onsite", label: "On-site" },
  { value: "other", label: "Other" },
];
const interviewModeLabel = (mode: string) =>
  INTERVIEW_MODE_OPTIONS.find((m) => m.value === mode)?.label || mode;

const CONVERSATION_POLL_MS = 15000;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const TYPING_HIDE_MS = 3500;
const EMOJIS = ["😀", "😄", "😅", "😊", "😍", "👍", "🙏", "🎉", "🔥", "✅", "💼", "📄", "👋", "🤝", "⭐", "❤️"];

const SSE_EVENTS = [
  "connected",
  "heartbeat",
  "message",
  "message-read",
  "typing",
  "presence",
  "conversation-created",
  "application-updated",
];

const formatTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatListTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const formatDateLabel = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

const formatDuration = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

const Avatar = ({ name, photoUrl, size = 44 }: { name: string; photoUrl?: string; size?: number }) =>
  photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoUrl}
      alt={name}
      className="shrink-0 rounded-full object-cover"
      style={{ height: size, width: size }}
    />
  ) : (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary"
      style={{ height: size, width: size, fontSize: size * 0.36 }}
    >
      {initialsOf(name)}
    </div>
  );

// Maps the backend application stages onto the 5-step hiring pipeline shown in
// the candidate sidebar (Applied → Shortlisted → Interview → Offer → Joined).
const PIPELINE_STEPS = ["Applied", "Shortlisted", "Interview", "Offer", "Joined"] as const;
const STATUS_TO_STEP: Record<string, number> = {
  applied: 0,
  "under-review": 0,
  screening: 1,
  interview: 2,
  offer: 3,
  hired: 4,
};

const StatusPipeline = ({ status }: { status: ApplicationStatus }) => {
  if (status === "rejected") {
    return (
      <div className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-xs font-semibold text-destructive">
        Application closed
      </div>
    );
  }
  const current = STATUS_TO_STEP[status] ?? 0;
  return (
    <div className="flex items-center justify-between">
      {PIPELINE_STEPS.map((label, idx) => {
        const done = idx <= current;
        return (
          <div key={label} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${idx === 0 ? "opacity-0" : done ? "bg-primary" : "bg-border"}`} />
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition ${done ? "bg-primary text-white" : "border border-border bg-card text-muted-foreground"
                  }`}
              >
                {idx + 1}
              </span>
              <span
                className={`h-0.5 flex-1 ${idx === PIPELINE_STEPS.length - 1 ? "opacity-0" : idx < current ? "bg-primary" : "bg-border"}`}
              />
            </div>
            <span className={`mt-1 text-[9px] font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const Ticks = ({ status }: { status: ChatMessage["status"] }) => {
  if (status === "read") return <CheckCheck size={15} className="text-sky-300" />;
  if (status === "delivered") return <CheckCheck size={15} className="text-white/70" />;
  return <Check size={15} className="text-white/70" />;
};

type MessagesProps = {
  /** Render inside a dashboard tab instead of the standalone /messages page. */
  embedded?: boolean;
  className?: string;
  /** Open chat for this application when switching to the Messages tab. */
  preferApplicationId?: string | null;
  loginRedirect?: string;
};

const Messages = ({
  embedded = false,
  className,
  preferApplicationId = null,
  loginRedirect = "/messages",
}: MessagesProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = typeof window !== "undefined" ? getSession() : null;
  const myRole = session?.user.role;

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
  const [listSearch, setListSearch] = useState("");
  const [msgSearch, setMsgSearch] = useState("");
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showInterview, setShowInterview] = useState(false);
  const [schedulingInterview, setSchedulingInterview] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    scheduledAt: "",
    mode: "video",
    meetingLink: "",
    locationText: "",
    notes: "",
  });

  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const typingSentAtRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const cancelRecordRef = useRef(false);

  activeIdRef.current = activeId;

  // Gate the screen behind login.
  useEffect(() => {
    if (!session) {
      if (!embedded) {
        navigate(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
      }
      return;
    }
    setAuthChecked(true);
  }, [embedded, loginRedirect, navigate, session]);

  const loadConversations = useCallback(async (preferApplicationId?: string | null) => {
    try {
      const list = await fetchConversations();
      setConversations(list);
      setActiveId((prev) => {
        if (prev) return prev;
        if (preferApplicationId) {
          const match = list.find((c) => c.applicationId === preferApplicationId);
          if (match) return match.id;
        }
        // On phones, show the conversation list first instead of jumping into a
        // chat. Only auto-open the most recent thread on tablet/desktop, where
        // the list stays visible alongside it.
        const isWide = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
        return isWide ? list[0]?.id ?? null : null;
      });
    } catch {
      // Keep whatever we have rather than blanking the UI.
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
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unread: 0, online: conversation.online } : c)),
      );
    } catch {
      /* leave existing thread in place */
    } finally {
      if (showSpinner) setLoadingThread(false);
    }
  }, []);

  const openApplicationChat = useCallback(
    async (applicationId: string) => {
      try {
        const conv = await openConversation(applicationId);
        setActiveId(conv.id);
        setConversations((prev) => (prev.some((c) => c.id === conv.id) ? prev : [conv, ...prev]));
      } catch {
        setError("Could not open this conversation. Please try again.");
      }
    },
    [],
  );

  // Initial load (+ deep link via ?application= or ?c=).
  useEffect(() => {
    if (!authChecked) return;
    const params = new URLSearchParams(location.search);
    const deepConv = params.get("c");
    const deepApp = params.get("application") || preferApplicationId || null;

    void loadConversations(deepApp);

    // Open the exact thread directly so clicking "Chat" lands you inside the
    // conversation (WhatsApp-style), even before the list finishes loading.
    if (deepConv) {
      setActiveId(deepConv);
    } else if (deepApp) {
      void openApplicationChat(deepApp);
    }

    const id = window.setInterval(() => loadConversations(), CONVERSATION_POLL_MS);
    return () => window.clearInterval(id);
  }, [authChecked, loadConversations, location.search, openApplicationChat, preferApplicationId]);

  // Load the active thread when it changes.
  useEffect(() => {
    if (!activeId) return;
    setOtherTyping(false);
    void loadThread(activeId, true);
  }, [activeId, loadThread]);

  // Auto-scroll to the newest message.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeId, otherTyping]);

  // Real-time updates.
  const handleSseEvent = useCallback(
    ({ type, data }: { type: string; data: unknown }) => {
      const payload = (data || {}) as Record<string, any>;

      if (type === "message" && payload.conversationId) {
        if (payload.conversationId === activeIdRef.current && payload.message) {
          setMessages((prev) =>
            prev.some((m) => m.id === payload.message.id) ? prev : [...prev, payload.message as ChatMessage],
          );
          markConversationRead(payload.conversationId);
          setConversations((prev) =>
            prev.map((c) =>
              c.id === payload.conversationId
                ? { ...c, lastMessage: payload.lastMessage || c.lastMessage, unread: 0 }
                : c,
            ),
          );
        } else {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === payload.conversationId
                ? {
                  ...c,
                  lastMessage: payload.lastMessage || c.lastMessage,
                  lastMessageAt: new Date().toISOString(),
                  unread: (c.unread || 0) + 1,
                }
                : c,
            ),
          );
          void loadConversations();
        }
        return;
      }

      if (type === "message-read" && payload.conversationId === activeIdRef.current) {
        setMessages((prev) => prev.map((m) => (m.mine ? { ...m, status: "read" } : m)));
        return;
      }

      if (type === "typing" && payload.conversationId === activeIdRef.current) {
        setOtherTyping(Boolean(payload.typing));
        if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
        if (payload.typing) {
          typingTimerRef.current = window.setTimeout(() => setOtherTyping(false), TYPING_HIDE_MS);
        }
        return;
      }

      if (type === "presence" && payload.userId) {
        setConversations((prev) =>
          prev.map((c) => (c.withUserId === payload.userId ? { ...c, online: Boolean(payload.online) } : c)),
        );
        setActiveConv((prev) =>
          prev && prev.withUserId === payload.userId ? { ...prev, online: Boolean(payload.online) } : prev,
        );
        return;
      }

      if (type === "conversation-created") {
        void loadConversations();
      }
    },
    [loadConversations],
  );

  useServerEvents({
    enabled: authChecked,
    eventNames: SSE_EVENTS,
    onEvent: handleSseEvent,
  });

  const onDraftChange = (value: string) => {
    setDraft(value);
    if (!activeId) return;
    const now = Date.now();
    if (now - typingSentAtRef.current > 2000) {
      typingSentAtRef.current = now;
      sendTyping(activeId, true);
    }
  };

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
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
      setDraft("");
      setFile(null);
      setShowEmoji(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === activeId
              ? { ...c, lastMessage: sent.body || sent.attachment?.name || "", lastMessageAt: sent.createdAt }
              : c,
          )
          .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()),
      );
    } catch {
      setError("Could not send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const pushSentMessage = (sent: ChatMessage, preview: string) => {
    setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
    setConversations((prev) =>
      prev
        .map((c) =>
          c.id === activeId ? { ...c, lastMessage: preview, lastMessageAt: sent.createdAt } : c,
        )
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()),
    );
  };

  const stopRecordTimer = () => {
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  const startRecording = async () => {
    if (recording || sending || !activeId) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Voice recording isn't supported on this device.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recordChunksRef.current = [];
      cancelRecordRef.current = false;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        stopRecordTimer();
        setRecording(false);
        const wasCancelled = cancelRecordRef.current;
        setRecordSeconds(0);
        if (wasCancelled || recordChunksRef.current.length === 0) return;

        const blob = new Blob(recordChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (blob.size < 1200) return; // ignore accidental taps
        const ext = (recorder.mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm";
        const voiceFile = new File([blob], `voice-note-${Date.now()}.${ext}`, { type: blob.type });

        setSending(true);
        setError(null);
        try {
          const sent = await sendMessage(activeId, "", voiceFile);
          pushSentMessage(sent, "🎤 Voice note");
        } catch {
          setError("Could not send the voice note. Please try again.");
        } finally {
          setSending(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordSeconds(0);
      setShowEmoji(false);
      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => {
          // Auto-stop at 2 minutes to keep files small.
          if (s >= 120) {
            mediaRecorderRef.current?.stop();
            return s;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      setError("Microphone access was blocked. Enable it to send a voice note.");
    }
  };

  const stopRecording = () => {
    if (!recording) return;
    cancelRecordRef.current = false;
    mediaRecorderRef.current?.stop();
  };

  const cancelRecording = () => {
    if (!recording) return;
    cancelRecordRef.current = true;
    mediaRecorderRef.current?.stop();
  };

  // Tidy up the recorder/timer if the user navigates away mid-recording.
  useEffect(() => () => stopRecordTimer(), []);

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId || !interviewForm.scheduledAt || schedulingInterview) return;
    setSchedulingInterview(true);
    setError(null);
    try {
      const msg = await scheduleInterview(activeId, interviewForm);
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setShowInterview(false);
      setInterviewForm({ scheduledAt: "", mode: "video", meetingLink: "", locationText: "", notes: "" });
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, lastMessage: msg.body } : c)),
      );
    } catch {
      setError("Could not schedule the interview. Please try again.");
    } finally {
      setSchedulingInterview(false);
    }
  };

  const openConversationRow = (id: string) => {
    setActiveId(id);
    setShowDetails(false);
    setShowInterview(false);
    setMsgSearch("");
    setShowMsgSearch(false);
  };

  const filteredConversations = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      [c.withName, c.jobTitle, c.companyName, c.lastMessage].some((v) => (v || "").toLowerCase().includes(q)),
    );
  }, [conversations, listSearch]);

  const visibleMessages = useMemo(() => {
    const q = msgSearch.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) => (m.body || "").toLowerCase().includes(q));
  }, [messages, msgSearch]);

  const candidate = activeConv?.candidate;
  const canShowDetails = myRole === "client" && Boolean(candidate);

  if (!authChecked) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-background",
          embedded ? "h-[420px] w-full rounded-2xl border border-border" : "min-h-screen",
        )}
      >
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  const chatShellClass = embedded
    ? cn(
        "grid h-full min-h-0 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid-cols-[330px_1fr]",
        className ?? "h-[calc(100vh-11rem)] min-h-[480px]",
      )
    : cn(
        "mx-auto grid h-[calc(100vh-2rem)] min-h-[560px] w-full max-w-[1600px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid-cols-[360px_1fr]",
        className,
      );

  return (
    <div
      className={
        embedded
          ? cn(
              "flex min-h-0 w-full flex-1",
              // Phones: full-screen immersive thread when a conversation is open
              // (the in-chat back arrow returns to the list). Desktop unchanged.
              activeId && "fixed inset-0 z-[70] bg-background md:static md:z-auto",
            )
          : "min-h-screen bg-background px-3 py-4 sm:px-4 sm:py-6"
      }
    >
      {!embedded && (
        <div className="mx-auto mb-4 flex max-w-[1600px] items-center justify-between gap-3 px-1">
          <div>
            <h1 className="text-xl font-bold text-foreground">Messages</h1>
            <p className="text-sm text-muted-foreground">Chat with employers and candidates in real time.</p>
          </div>
          <Link
            to={myRole === "client" ? "/dashboard/client" : "/dashboard/candidate"}
            className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Back to dashboard
          </Link>
        </div>
      )}
      <div className={chatShellClass}>
          <aside className={`flex flex-col border-r  border-border ${activeId ? "hidden md:flex" : "flex"}`}>
            <header className="border-b border-border px-4 py-4">
              <h1 className="text-lg font-bold text-foreground">Messages</h1>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="Search chats"
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </header>
            <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
              {loadingList ? (
                <div className="space-y-1 p-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-1 py-2.5">
                      <div className="skeleton h-11 w-11 shrink-0 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-3 w-2/3" />
                        <div className="skeleton h-2.5 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No conversations yet. Apply to a job and a chat opens automatically.
                  <div className="mt-4">
                    <Link to="/jobs" className="btn-gradient inline-block rounded-lg px-4 py-2 text-sm font-semibold">
                      Browse Jobs
                    </Link>
                  </div>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => openConversationRow(conv.id)}
                    className={`flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left transition hover:bg-muted/50 ${activeId === conv.id ? "bg-muted/60" : ""
                      }`}
                  >
                    <div className="relative">
                      <Avatar name={conv.withName} photoUrl={conv.withPhotoUrl} />
                      {conv.online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold text-foreground">{conv.withName}</span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatListTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      {conv.jobTitle && <div className="truncate text-[11px] text-primary">{conv.jobTitle}</div>}
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-muted-foreground">
                          {conv.lastSenderRole === "system" ? "📋 " : ""}
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

          {/* Chat + details */}
          <section
            className={`grid min-w-0 min-h-0 ${activeId ? "grid" : "hidden md:grid"
              } ${showDetails && canShowDetails
                ? "lg:grid-cols-[1fr_300px]"
                : "grid-cols-1"
              }`}
          >
            <div className="flex min-w-0 min-h-0 flex-col">
              {!activeConv ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageSquare size={28} />
                  </div>
                  <p className="font-semibold text-foreground">Your messages</p>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    Select a conversation from the list to view and reply to messages.
                  </p>
                </div>
              ) : (
                <>
                  <header className="flex items-center gap-3 border-b border-border px-4 py-3">
                    <button
                      onClick={() => setActiveId(null)}
                      className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-muted md:hidden"
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div className="relative">
                      <Avatar name={activeConv.withName} photoUrl={activeConv.withPhotoUrl} size={40} />
                      {activeConv.online && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-foreground">{activeConv.withName}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {otherTyping ? (
                          <span className="text-emerald-500">typing…</span>
                        ) : activeConv.online ? (
                          "Online"
                        ) : (
                          activeConv.jobTitle || "Offline"
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowMsgSearch((v) => !v)}
                      className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-primary"
                      aria-label="Search messages"
                    >
                      <Search size={18} />
                    </button>
                    {myRole === "client" && (
                      <button
                        onClick={() => setShowInterview((v) => !v)}
                        className={`rounded-lg p-2 transition hover:bg-muted ${showInterview ? "text-primary" : "text-muted-foreground hover:text-primary"
                          }`}
                        aria-label="Schedule interview"
                        title="Schedule interview"
                      >
                        <CalendarPlus size={18} />
                      </button>
                    )}
                    {canShowDetails && (
                      <button
                        onClick={() => setShowDetails((v) => !v)}
                        className={`rounded-lg p-2 transition hover:bg-muted ${showDetails ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                        aria-label="Candidate details"
                      >
                        <Info size={18} />
                      </button>
                    )}
                  </header>

                  {showMsgSearch && (
                    <div className="border-b border-border bg-muted/30 px-4 py-2">
                      <input
                        autoFocus
                        value={msgSearch}
                        onChange={(e) => setMsgSearch(e.target.value)}
                        placeholder="Search in conversation"
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  )}

                  {showInterview && myRole === "client" && (
                    <form
                      onSubmit={handleScheduleInterview}
                      className="space-y-2 border-b border-border bg-muted/30 px-4 py-3"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <CalendarPlus size={16} /> Schedule an interview
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          type="datetime-local"
                          required
                          value={interviewForm.scheduledAt}
                          onChange={(e) => setInterviewForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        />
                        <select
                          value={interviewForm.mode}
                          onChange={(e) => setInterviewForm((f) => ({ ...f, mode: e.target.value }))}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        >
                          {INTERVIEW_MODE_OPTIONS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                        <input
                          placeholder="Meeting link (optional)"
                          value={interviewForm.meetingLink}
                          onChange={(e) => setInterviewForm((f) => ({ ...f, meetingLink: e.target.value }))}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        />
                        <input
                          placeholder="Location (optional)"
                          value={interviewForm.locationText}
                          onChange={(e) => setInterviewForm((f) => ({ ...f, locationText: e.target.value }))}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                      <input
                        placeholder="Notes (optional)"
                        value={interviewForm.notes}
                        onChange={(e) => setInterviewForm((f) => ({ ...f, notes: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowInterview(false)}
                          className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-foreground"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={schedulingInterview || !interviewForm.scheduledAt}
                          className="btn-gradient rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                        >
                          {schedulingInterview ? "Scheduling…" : "Send invite"}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="scrollbar-slim min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-muted/20 px-4 py-4">
                    {loadingThread ? (
                      <div className="flex justify-center py-10 text-muted-foreground">
                        <Loader2 className="animate-spin" size={20} />
                      </div>
                    ) : visibleMessages.length === 0 ? (
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        {msgSearch ? "No messages match your search." : "No messages yet. Say hello 👋"}
                      </div>
                    ) : (
                      visibleMessages.map((msg, idx) => {
                        const prev = visibleMessages[idx - 1];
                        const showDate =
                          !prev || formatDateLabel(prev.createdAt) !== formatDateLabel(msg.createdAt);

                        if (msg.system) {
                          return (
                            <div key={msg.id}>
                              {showDate && (
                                <div className="my-3 flex justify-center">
                                  <span className="rounded-full bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
                                    {formatDateLabel(msg.createdAt)}
                                  </span>
                                </div>
                              )}
                              <div className="my-2 flex justify-center">
                                <span className="max-w-[85%] rounded-lg bg-amber-50 px-3 py-1.5 text-center text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                  {msg.body}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        if (msg.messageType === "interview" && msg.meta) {
                          const meta = msg.meta;
                          const when = new Date(meta.scheduledAt);
                          return (
                            <div key={msg.id}>
                              {showDate && (
                                <div className="my-3 flex justify-center">
                                  <span className="rounded-full bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
                                    {formatDateLabel(msg.createdAt)}
                                  </span>
                                </div>
                              )}
                              <div className={`flex ${msg.mine ? "justify-end" : "justify-start"}`}>
                                <div className="max-w-[85%] rounded-2xl border border-[#264a7f]/25 bg-card p-3 shadow-sm">
                                  <div className="flex items-center gap-2 text-sm font-bold text-[#264a7f] dark:text-[#7da7df]">
                                    <Calendar size={16} /> Interview invitation
                                  </div>
                                  <div className="mt-2 space-y-1.5 text-sm text-foreground">
                                    <div className="flex items-center gap-2">
                                      <Clock size={14} className="shrink-0 text-muted-foreground" />
                                      {Number.isNaN(when.getTime()) ? meta.scheduledAt : when.toLocaleString()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Video size={14} className="shrink-0 text-muted-foreground" />
                                      {interviewModeLabel(meta.mode)}
                                    </div>
                                    {meta.locationText && (
                                      <div className="flex items-center gap-2">
                                        <MapPin size={14} className="shrink-0 text-muted-foreground" />
                                        {meta.locationText}
                                      </div>
                                    )}
                                    {meta.notes && <p className="text-muted-foreground">{meta.notes}</p>}
                                  </div>
                                  {meta.meetingLink && (
                                    <a
                                      href={meta.meetingLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn-gradient mt-3 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
                                    >
                                      <Video size={15} /> Join meeting
                                    </a>
                                  )}
                                  <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                                    {formatTime(msg.createdAt)}
                                    {msg.mine && <Ticks status={msg.status} />}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        const isImage = msg.messageType === "image" && msg.attachment;
                        const isAudio =
                          msg.attachment &&
                          (msg.messageType === "audio" || (msg.attachment.type || "").startsWith("audio/"));
                        return (
                          <div key={msg.id}>
                            {showDate && (
                              <div className="my-3 flex justify-center">
                                <span className="rounded-full bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
                                  {formatDateLabel(msg.createdAt)}
                                </span>
                              </div>
                            )}
                            <div className={`flex ${msg.mine ? "justify-end" : "justify-start"}`}>
                              <div
                                className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${msg.mine
                                  ? "rounded-br-sm bg-primary text-white"
                                  : "rounded-bl-sm border border-border bg-card text-foreground"
                                  }`}
                              >
                                {isImage ? (
                                  <a href={msg.attachment!.url} target="_blank" rel="noopener noreferrer">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={msg.attachment!.url}
                                      alt={msg.attachment!.name}
                                      className="mb-1 max-h-60 w-full rounded-lg object-cover"
                                    />
                                  </a>
                                ) : isAudio ? (
                                  <div className="mb-1 flex items-center gap-2">
                                    <Mic size={15} className={msg.mine ? "shrink-0 text-white/80" : "shrink-0 text-primary"} />
                                    <audio
                                      src={msg.attachment!.url}
                                      controls
                                      preload="metadata"
                                      className="h-9 w-56 max-w-[60vw]"
                                    />
                                  </div>
                                ) : (
                                  msg.attachment && (
                                    <a
                                      href={msg.attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium ${msg.mine ? "bg-white/15" : "bg-muted"
                                        }`}
                                    >
                                      <FileText size={15} />
                                      <span className="truncate">{msg.attachment.name}</span>
                                    </a>
                                  )
                                )}
                                {msg.body && <p className="whitespace-pre-wrap break-words">{msg.body}</p>}
                                <div
                                  className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${msg.mine ? "text-white/70" : "text-muted-foreground"
                                    }`}
                                >
                                  {formatTime(msg.createdAt)}
                                  {msg.mine && <Ticks status={msg.status} />}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {otherTyping && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-sm">
                          <span className="inline-flex gap-1">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                          </span>
                        </div>
                      </div>
                    )}
                    <div ref={threadEndRef} />
                  </div>

                  <form onSubmit={handleSend} className="relative border-t border-border px-3 py-3">
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
                    {showEmoji && (
                      <div className="absolute bottom-full left-3 mb-2 grid grid-cols-8 gap-1 rounded-xl border border-border bg-card p-2 shadow-lg">
                        {EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setDraft((d) => d + emoji);
                              setShowEmoji(false);
                            }}
                            className="rounded-lg p-1 text-lg transition hover:bg-muted"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={onPickFile}
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                    />
                    {recording ? (
                      <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                        <button
                          type="button"
                          onClick={cancelRecording}
                          className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-destructive"
                          aria-label="Cancel recording"
                          title="Cancel"
                        >
                          <Trash2 size={18} />
                        </button>
                        <span className="flex items-center gap-2 text-sm font-medium text-destructive">
                          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" />
                          Recording… {formatDuration(recordSeconds)}
                        </span>
                        <span className="flex-1" />
                        <button
                          type="button"
                          onClick={stopRecording}
                          disabled={sending}
                          className="btn-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-xl disabled:opacity-50"
                          aria-label="Stop and send voice note"
                          title="Send voice note"
                        >
                          {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowEmoji((v) => !v)}
                          className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-primary sm:p-2.5"
                          aria-label="Emoji"
                        >
                          <Smile size={20} />
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-primary sm:p-2.5"
                          aria-label="Attach a file"
                        >
                          <Paperclip size={20} />
                        </button>
                        <textarea
                          value={draft}
                          onChange={(e) => onDraftChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSend(e);
                            }
                          }}
                          rows={1}
                          placeholder="Write a message…"
                          className="max-h-32 min-h-[2.75rem] min-w-0 flex-1 resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-[15px] focus:border-primary focus:outline-none sm:px-4 sm:py-2.5 sm:text-sm"
                        />
                        {draft.trim() || file ? (
                          <button
                            type="submit"
                            disabled={sending}
                            className="btn-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-xl disabled:opacity-50"
                            aria-label="Send message"
                          >
                            {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={startRecording}
                            disabled={sending}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition hover:bg-primary hover:text-white disabled:opacity-50"
                            aria-label="Record voice note"
                            title="Record voice note"
                          >
                            <Mic size={20} />
                          </button>
                        )}
                      </div>
                    )}
                  </form>
                </>
              )}
            </div>

            {/* Candidate details panel (employer view) */}
            {showDetails && canShowDetails && candidate && (
              <aside className="scrollbar-slim hidden flex-col overflow-y-auto border-l border-border bg-card lg:flex">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <span className="font-semibold text-foreground">Candidate details</span>
                  <button onClick={() => setShowDetails(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={18} />
                  </button>
                </div>
                <div className="flex flex-col items-center gap-2 px-4 py-5 text-center">
                  <Avatar name={candidate.fullName} photoUrl={candidate.photoUrl} size={72} />
                  <div className="font-bold text-foreground">{candidate.fullName || "Candidate"}</div>
                  {candidate.appliedFor && (
                    <div className="text-xs text-primary">Applied for {candidate.appliedFor}</div>
                  )}
                </div>
                {activeConv?.status && (
                  <div className="border-y border-border bg-muted/30 px-4 py-4">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Hiring stage
                    </div>
                    <StatusPipeline status={activeConv.status} />
                  </div>
                )}
                <div className="space-y-3 px-4 pb-6 pt-4 text-sm">
                  {candidate.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail size={15} className="shrink-0" />
                      <span className="truncate text-foreground">{candidate.email}</span>
                    </div>
                  )}
                  {candidate.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone size={15} className="shrink-0" />
                      <span className="text-foreground">{candidate.phone}</span>
                    </div>
                  )}
                  {candidate.preferredLocation && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin size={15} className="shrink-0" />
                      <span className="text-foreground">{candidate.preferredLocation}</span>
                    </div>
                  )}
                  {candidate.qualification && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qualification</div>
                      <div className="text-foreground">{candidate.qualification}</div>
                    </div>
                  )}
                  {candidate.experience && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Experience</div>
                      <div className="text-foreground">{candidate.experience}</div>
                    </div>
                  )}
                  {candidate.skills?.length > 0 && (
                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills</div>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.skills.map((skill) => (
                          <span key={skill} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 pt-2">
                    {candidate.resumeUrl && (
                      <a
                        href={candidate.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-gradient flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
                      >
                        <Download size={15} /> Download résumé
                      </a>
                    )}
                    {candidate.portfolioUrl && (
                      <a
                        href={candidate.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                      >
                        <ExternalLink size={15} /> Portfolio
                      </a>
                    )}
                    {candidate.linkedinUrl && (
                      <a
                        href={candidate.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                      >
                        <ExternalLink size={15} /> LinkedIn
                      </a>
                    )}
                  </div>
                  {candidate.videos?.length > 0 && (
                    <div className="pt-2">
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Video size={14} /> Candidate videos
                      </div>
                      <div className="space-y-3">
                        {candidate.videos.map((video, idx) => (
                          <div key={video.url || idx} className="overflow-hidden rounded-lg border border-border">
                            <video
                              src={video.url}
                              controls
                              preload="metadata"
                              className="w-full bg-black"
                            />
                            {video.name && (
                              <div className="truncate px-2 py-1.5 text-xs text-muted-foreground">
                                {video.name}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            )}
          </section>
      </div>
    </div>
  );
};

export default Messages;
