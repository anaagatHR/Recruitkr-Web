export const DEFAULT_API_ERROR_MESSAGE = "Connection issue, retrying...";
export const TIMEOUT_API_ERROR_MESSAGE = "Backend is taking too long to respond. Check the server and MongoDB.";
export const SERVER_API_ERROR_MESSAGE = "Backend is unavailable. Check the backend server and MongoDB.";
export const API_MISCONFIGURED_MESSAGE =
  "API misconfigured. Check NEXT_PUBLIC_API_URL or backend routing";

const TECHNICAL_MESSAGE_PATTERNS = [
  /vite_api_url/i,
  /cors_origin/i,
  /localhost/i,
  /failed to fetch/i,
  /networkerror/i,
  /fetch/i,
  /timeout/i,
  /abort/i,
  /ecconn/i,
  /stack/i,
];

export class ApiClientError extends Error {
  status?: number;
  /** Stable server reason, e.g. "PROFILE_INCOMPLETE" or "ALREADY_APPLIED". */
  code?: string;
  /** Structured server payload for that reason (e.g. missing profile fields). */
  data?: unknown;

  constructor(message: string, options?: { status?: number; cause?: unknown; code?: string; data?: unknown }) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "ApiClientError";
    this.status = options?.status;
    this.code = options?.code;
    this.data = options?.data;
  }
}

const isAbortError = (error: unknown) =>
  error instanceof DOMException
    ? error.name === "AbortError"
    : typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name?: string }).name === "AbortError";

const isTechnicalMessage = (message: string) =>
  TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));

export const getFriendlyApiMessage = (
  status?: number,
  serverMessage?: string | null,
  fallbackMessage = DEFAULT_API_ERROR_MESSAGE,
) => {
  const cleanedServerMessage = serverMessage?.trim();
  const safeServerMessage =
    cleanedServerMessage && !isTechnicalMessage(cleanedServerMessage)
      ? cleanedServerMessage
      : null;

  if (status === 400 || status === 404 || status === 409 || status === 422) {
    return safeServerMessage || "We couldn't complete that request. Please review the details and try again.";
  }

  if (status === 401) {
    return safeServerMessage || "Your session has expired. Please sign in and try again.";
  }

  if (status === 403) {
    return safeServerMessage || "You don't have permission to do that.";
  }

  if (status === 429) {
    return "You're doing that a little too quickly. Please wait a moment and try again.";
  }

  if (typeof status === "number" && status >= 500) {
    return safeServerMessage || SERVER_API_ERROR_MESSAGE;
  }

  return safeServerMessage || fallbackMessage;
};

type BuildApiErrorOptions = {
  context: string;
  method: string;
  url: string;
  error?: unknown;
  status?: number;
  serverMessage?: string | null;
  payload?: unknown;
  fallbackMessage?: string;
  timeout?: boolean;
};

export const buildApiError = ({
  context,
  method,
  url,
  error,
  status,
  serverMessage,
  payload,
  fallbackMessage,
  timeout = false,
}: BuildApiErrorOptions) => {
  const userMessage = timeout
    ? TIMEOUT_API_ERROR_MESSAGE
    : getFriendlyApiMessage(status, serverMessage, fallbackMessage);

  console.error(`[api] ${context}`, {
    method,
    url,
    status,
    timeout,
    serverMessage,
    payload,
    error,
  });

  const body = payload && typeof payload === "object" ? (payload as { code?: unknown; data?: unknown }) : null;

  return new ApiClientError(userMessage, {
    status,
    cause: error,
    code: typeof body?.code === "string" ? body.code : undefined,
    data: body?.data,
  });
};

export const getErrorMessage = (
  error: unknown,
  fallbackMessage = DEFAULT_API_ERROR_MESSAGE,
) => {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (isAbortError(error)) {
    return TIMEOUT_API_ERROR_MESSAGE;
  }

  if (error instanceof Error) {
    const safeMessage = error.message.trim();
    if (safeMessage && !isTechnicalMessage(safeMessage)) {
      return safeMessage;
    }
  }

  return fallbackMessage;
};

export { isAbortError };
