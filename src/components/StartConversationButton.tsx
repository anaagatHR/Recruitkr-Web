"use client";
import { useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { useNavigate } from "@/compat/router";
import { openConversation } from "@/lib/messages";

type Props = {
  applicationId: string;
  label?: string;
  className?: string;
};

/**
 * Opens (or reuses) the conversation tied to an application, then jumps to the
 * messages screen. Works for either party — employers start it, candidates reopen it.
 */
const StartConversationButton = ({ applicationId, label = "Message", className }: Props) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await openConversation(applicationId);
      navigate("/messages");
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={
        className ||
        "inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white disabled:opacity-60"
      }
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : <MessageSquare size={16} />}
      {label}
    </button>
  );
};

export default StartConversationButton;
