import { apiPost } from "@/lib/api";

export type AssistantAction = { type: "navigate"; to: string; label?: string };

export type AssistantResult = {
  reply: string;
  intent: string;
  action?: AssistantAction;
  suggestions?: string[];
  source?: string;
};

type ApiEnvelope = { success?: boolean; data: AssistantResult };

/**
 * Ask the native RecruitKrBot. `page` is the current route so the bot can answer
 * "explain this page" / "go back". No external AI — handled server-side.
 */
export const askAssistant = async (message: string, page?: string): Promise<AssistantResult> => {
  const res = await apiPost<ApiEnvelope>("/assistant/message", { message, page });
  return (
    res?.data ?? {
      reply: "Sorry, I couldn't respond just now. Please try again.",
      intent: "error",
    }
  );
};
