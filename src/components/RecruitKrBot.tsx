"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { useNavigate } from "@/compat/router";
import { cn } from "@/lib/utils";
import { askAssistant, type AssistantAction } from "@/lib/assistant";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  action?: AssistantAction;
};

const GREETING =
  "👋 Hi! I'm RecruitKrBot. I can help you find jobs, hire candidates, navigate the site, or explain how things work. What would you like to do?";

const DEFAULT_SUGGESTIONS = [
  "How do I apply for a job?",
  "How do I post a job?",
  "Where do I upload my resume?",
  "Open jobs",
];

export default function RecruitKrBot() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: GREETING }]);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const goTo = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    setMessages((prev) => [...prev, { role: "user", content }]);
    setInput("");
    setLoading(true);
    try {
      const page = typeof window !== "undefined" ? window.location.pathname : undefined;
      const result = await askAssistant(content, page);
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply, action: result.action }]);
      if (result.suggestions?.length) setSuggestions(result.suggestions);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble right now. Please try again, or reach us via the Contact page.",
          action: { type: "navigate", to: "/contact", label: "Contact us" },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close RecruitKrBot" : "Open RecruitKrBot"}
        className={cn(
          "fixed bottom-20 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-all hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6",
          open && "rotate-90",
        )}
        style={{ background: "linear-gradient(135deg,#264a7f 0%,#69a44f 100%)" }}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-x-3 bottom-[5.5rem] top-16 z-[60] flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:top-auto sm:h-[560px] sm:w-[26rem]">
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 text-white"
            style={{ background: "linear-gradient(135deg,#264a7f 0%,#69a44f 100%)" }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <Bot size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight">RecruitKrBot</p>
              <p className="text-[11px] text-white/80">Your hiring &amp; career assistant</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Minimize"
              className="ml-auto rounded-lg p-1.5 text-white/90 transition hover:bg-white/15"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex flex-col gap-1.5", m.role === "user" ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "rounded-br-sm bg-[#264a7f] text-white"
                      : "rounded-bl-sm border border-border bg-card text-foreground",
                  )}
                >
                  {m.content}
                </div>
                {m.action?.type === "navigate" && (
                  <button
                    type="button"
                    onClick={() => goTo(m.action!.to)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/15"
                  >
                    {m.action.label || "Open"} <ArrowRight size={14} />
                  </button>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground shadow-sm">
                  <Loader2 size={15} className="animate-spin" /> Thinking…
                </div>
              </div>
            )}

            {!loading && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-card p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask RecruitKrBot…"
              aria-label="Message"
              className="h-11 flex-1 rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#264a7f 0%,#69a44f 100%)" }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
