export type UserRole = 'candidate' | 'client' | 'admin';

export type AuthSession = {
  accessToken: string;
  /**
   * Never persisted in the browser (audit P1-6): the long-lived refresh token
   * lives only in the httpOnly `refreshToken` cookie, which /auth/refresh and
   * /auth/logout read when the body omits it. Kept on the type because login
   * responses still return it (the mobile app stores it natively).
   */
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
};

const AUTH_STORAGE_KEY = 'recruitkr.auth.session';

// shortcut: the 15-minute access token still lives in localStorage because the
// socket.io handshake (direct to the backend origin, where the frontend's cookie
// isn't sent) needs it; move it to memory once sockets authenticate by cookie.
const persist = ({ refreshToken: _dropped, ...session }: AuthSession) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const getSession = (): AuthSession | null => {
  // SSR-safe: localStorage only exists in the browser.
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accessToken || !parsed?.user?.id) return null;
    // Sessions saved before this change still carry a refresh token: drop it.
    if (parsed.refreshToken) persist(parsed);
    const { refreshToken: _legacy, ...session } = parsed;
    return session;
  } catch {
    return null;
  }
};

export const setSession = (session: AuthSession) => {
  if (typeof window === "undefined") return;
  persist(session);
};

export const clearSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  // Tear down the realtime socket on logout. Imported lazily to avoid pulling
  // socket.io-client into modules that only need session helpers.
  void import("@/lib/socket").then(({ disconnectSocket }) => disconnectSocket()).catch(() => {});
};

// The rotated refresh token arrives as an httpOnly cookie; only the access token is kept.
export const updateSessionTokens = (accessToken: string, _refreshToken?: string) => {
  const current = getSession();
  if (!current) return;

  setSession({ ...current, accessToken });
};

/** Where a signed-in user's "Profile" lives. */
export const dashboardPathForRole = (role: UserRole | undefined): string => {
  if (role === 'client') return '/dashboard/client';
  if (role === 'admin') return '/dashboard/admin/departments';
  return '/dashboard/candidate';
};
