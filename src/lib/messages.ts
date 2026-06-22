import { apiGet, apiPost, apiRequest } from "@/lib/api";

export type CandidateVideo = {
  url: string;
  name: string;
  type: string;
};

export type CandidateSnapshot = {
  fullName: string;
  email: string;
  phone: string;
  photoUrl: string;
  qualification: string;
  skills: string[];
  experience: string;
  preferredLocation: string;
  portfolioUrl: string;
  linkedinUrl: string;
  resumeUrl: string;
  videos: CandidateVideo[];
  appliedFor: string;
  appliedAt: string;
};

export type ApplicationStatus =
  | "applied"
  | "under-review"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected"
  | "";

export type ConversationSummary = {
  id: string;
  applicationId: string | null;
  jobId: string | null;
  jobTitle: string;
  companyName: string;
  companyLogoUrl: string;
  status: ApplicationStatus;
  candidateName: string;
  candidate: CandidateSnapshot;
  withName: string;
  withPhotoUrl: string;
  withUserId: string;
  online: boolean;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderRole: "candidate" | "client" | "system";
  unread: number;
};

export type MessageAttachment = {
  url: string;
  name: string;
  type: string;
  size: number;
};

export type MessageStatus = "sent" | "delivered" | "read";

export type InterviewMeta = {
  scheduledAt: string;
  mode: string;
  meetingLink: string;
  locationText: string;
  notes: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "candidate" | "client" | "system";
  messageType: string;
  system: boolean;
  mine: boolean;
  body: string;
  attachment: MessageAttachment | null;
  meta: InterviewMeta | null;
  status: MessageStatus;
  deliveredAt: string | null;
  readAt: string | null;
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

/**
 * Backward-compatible: resolve the conversation tied to an application. The
 * conversation is now auto-created on apply, so this just returns the existing
 * one (no manual "start conversation" anymore).
 */
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

/** Relay a typing indicator to the other participant (fire-and-forget). */
export const sendTyping = (conversationId: string, typing: boolean): void => {
  void apiPost(`/conversations/${conversationId}/typing`, { typing }, { auth: true }).catch(() => {});
};

/** Mark a conversation read (clears unread + emits read receipts). */
export const markConversationRead = (conversationId: string): void => {
  void apiPost(`/conversations/${conversationId}/read`, {}, { auth: true }).catch(() => {});
};

/** Employer schedules an interview from inside the chat. */
export const scheduleInterview = async (
  conversationId: string,
  data: { scheduledAt: string; mode: string; meetingLink?: string; locationText?: string; notes?: string },
): Promise<ChatMessage> => {
  const res = await apiPost<ApiEnvelope<ChatMessage>>(
    `/conversations/${conversationId}/interview`,
    data,
    { auth: true },
  );
  return res.data;
};
