/**
 * Talks to the website's API. Sign-in is the site's own admin login; tokens live
 * in sessionStorage (gone when the tab closes) and the short-lived access token
 * is refreshed with the refresh token in the request body, so no cross-site
 * cookie is needed even when the Studio is framed inside Business OS.
 */

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

type Session = { accessToken: string; refreshToken: string; email: string };
const KEY = "rk_site_studio";

export const getSession = (): Session | null => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
};
const setSession = (s: Session | null) => (s ? sessionStorage.setItem(KEY, JSON.stringify(s)) : sessionStorage.removeItem(KEY));

export class ApiFail extends Error {
  constructor(message: string, public status: number, public details: string[] = []) {
    super(message);
  }
}

const failFrom = async (res: Response) => {
  let body: { message?: string; details?: unknown } = {};
  try {
    body = await res.json();
  } catch {
    /* not JSON */
  }
  const details = Array.isArray(body.details) ? body.details.map(String) : [];
  return new ApiFail(body.message || `Request failed (${res.status})`, res.status, details);
};

export async function login(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role: "admin" }),
  });
  if (!res.ok) throw await failFrom(res);
  const { data } = await res.json();
  if (data?.user?.role !== "admin") throw new ApiFail("Only website admins can use Site Studio.", 403);
  setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, email: data.user.email });
}

export function logout() {
  setSession(null);
  window.location.reload();
}

let refreshing: Promise<boolean> | null = null;
const refresh = () =>
  (refreshing ??= (async () => {
    const s = getSession();
    if (!s) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: s.refreshToken }),
      });
      if (!res.ok) return false;
      const { data } = await res.json();
      setSession({ ...s, accessToken: data.accessToken, refreshToken: data.refreshToken });
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })());

type Options = { method?: string; body?: unknown };

/** JSON request with the admin token; refreshes once on 401, signs out if that fails. */
export async function api<T>(path: string, { method = "GET", body }: Options = {}, retried = false): Promise<T> {
  const s = getSession();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(s ? { Authorization: `Bearer ${s.accessToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && !retried) {
    if (await refresh()) return api<T>(path, { method, body }, true);
    logout();
  }
  if (!res.ok) throw await failFrom(res);
  return (await res.json()).data as T;
}

/** Multipart upload with a progress callback (fetch can't report upload progress). */
export function upload<T>(path: string, file: Blob, name: string, onProgress?: (pct: number) => void, retried = false): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}${path}`);
    const s = getSession();
    if (s) xhr.setRequestHeader("Authorization", `Bearer ${s.accessToken}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new ApiFail("Upload failed. Check your connection.", 0));
    xhr.onload = async () => {
      if (xhr.status === 401 && !retried && (await refresh())) {
        upload<T>(path, file, name, onProgress, true).then(resolve, reject);
        return;
      }
      let body: { data?: T; message?: string; details?: unknown } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* not JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body.data as T);
      else
        reject(
          new ApiFail(body.message || `Upload failed (${xhr.status})`, xhr.status, Array.isArray(body.details) ? body.details.map(String) : []),
        );
    };
    const form = new FormData();
    form.append("file", file, name);
    xhr.send(form);
  });
}

// --- Shapes the API returns -----------------------------------------------------

export type FieldSpec = {
  type: string;
  label: string;
  max?: number;
  min?: number;
  step?: number;
  unit?: string;
  options?: string[];
  item?: Record<string, FieldSpec>;
};
export type KeySpec = { label: string; group: string; fields: Record<string, FieldSpec> };
export type Schema = Record<string, KeySpec>;
export type Value = Record<string, unknown>;
export type ContentItem = {
  draft: Value | null;
  published: Value | null;
  version: number;
  updatedBy?: string;
  updatedAt?: string;
  publishedBy?: string;
  publishedAt?: string;
  hasChanges: boolean;
};
export type ContentList = { schema: Schema; items: Record<string, ContentItem> };
export type Revision = { _id: string; key: string; version: number; value: Value; publishedBy: string; note?: string; createdAt: string };
export type MediaFile = { name: string; url: string; fileId: string; kind: "image" | "video"; folder: string };
export type Member = {
  id: string;
  name: string;
  role: string;
  summary: string;
  image: string;
  video: string;
  linkedin: string;
  email: string;
  displayOrder: number;
  active: boolean;
};
