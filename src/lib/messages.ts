import { apiGet, apiPost, apiRequest } from "@/lib/api";

export type ConversationSummary = {
  id: string;
  applicationId: string | null;
  jobId: string | null;
  jobTitle: string;
  companyName: string;
  candidateName: string;
  withName: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderRole: "candidate" | "client";
  unread: number;
};

export type MessageAttachment = {
  url: string;
  name: string;
  type: string;
  size: number;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "candidate" | "client";
  mine: boolean;
  body: string;
  attachment: MessageAttachment | null;
  createdAt: string;
};

type ApiEnvelope<T> = { success?: boolean; data: T };

export const fetchConversations = async (): Promise<ConversationSummary[]> => {
  const res = await apiGet<ApiEnvelope<ConversationSummary[]>>("/conversations", { auth: true });
  return res?.data ?? [];
};

export const fetchThread = async (
  conversationId: string,
): Promise<{ conversation: ConversationSummary; messages: ChatMessage[] }> => {
  const res = await apiGet<ApiEnvelope<{ conversation: ConversationSummary; messages: ChatMessage[] }>>(
    `/conversations/${conversationId}/messages`,
    { auth: true },
  );
  return res.data;
};

/** Opens (or reuses) the conversation tied to an application. */
export const openConversation = async (applicationId: string): Promise<ConversationSummary> => {
  const res = await apiPost<ApiEnvelope<ConversationSummary>>(
    "/conversations",
    { applicationId },
    { auth: true },
  );
  return res.data;
};

/** Sends a text and/or file message. Uses multipart when a file is attached. */
export const sendMessage = async (
  conversationId: string,
  body: string,
  file?: File | null,
): Promise<ChatMessage> => {
  if (file) {
    const form = new FormData();
    form.append("body", body);
    form.append("file", file);
    const res = await apiRequest<ApiEnvelope<ChatMessage>>(
      `/conversations/${conversationId}/messages`,
      { method: "POST", body: form, auth: true },
    );
    return res.data;
  }

  const res = await apiPost<ApiEnvelope<ChatMessage>>(
    `/conversations/${conversationId}/messages`,
    { body },
    { auth: true },
  );
  return res.data;
};
