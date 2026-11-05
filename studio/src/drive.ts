/**
 * "From Google Drive": Google's own Picker shows the editor's Drive; the picked
 * file id and a read-only token go to the API, which copies the file onto our
 * storage (the site never links to Drive). Needs VITE_GOOGLE_CLIENT_ID and
 * VITE_GOOGLE_API_KEY; without them the button is hidden.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
export const driveEnabled = Boolean(CLIENT_ID && API_KEY);

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Google Drive. Check your connection."));
    document.head.appendChild(s);
  });

let token: { value: string; expires: number } | null = null;

const getToken = () =>
  new Promise<string>((resolve, reject) => {
    if (token && token.expires > Date.now() + 60_000) return resolve(token.value);
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      callback: (r: any) => {
        if (r.error) return reject(new Error("Google Drive access was not granted."));
        token = { value: r.access_token, expires: Date.now() + Number(r.expires_in || 3000) * 1000 };
        resolve(r.access_token);
      },
    });
    client.requestAccessToken({ prompt: token ? "" : "consent" });
  });

/** Opens the Picker. Resolves with the picked file and the token, or null if cancelled. */
export async function pickFromDrive(kind: "image" | "video" | "any" = "any"): Promise<{ fileId: string; accessToken: string } | null> {
  if (!driveEnabled) throw new Error("Google Drive is not set up for the Studio.");
  await Promise.all([loadScript("https://apis.google.com/js/api.js"), loadScript("https://accounts.google.com/gsi/client")]);
  await new Promise<void>((resolve) => window.gapi.load("picker", () => resolve()));
  const accessToken = await getToken();
  const { picker } = window.google;
  const view = new picker.DocsView(picker.ViewId.DOCS)
    .setIncludeFolders(true)
    .setMimeTypes(
      kind === "image"
        ? "image/jpeg,image/png,image/webp,image/svg+xml"
        : kind === "video"
          ? "video/mp4,video/webm"
          : "image/jpeg,image/png,image/webp,image/svg+xml,video/mp4,video/webm",
    );
  return new Promise((resolve) => {
    new picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(API_KEY)
      .setOrigin(window.location.origin)
      .setCallback((data: any) => {
        if (data.action === picker.Action.PICKED) resolve({ fileId: data.docs[0].id, accessToken });
        else if (data.action === picker.Action.CANCEL) resolve(null);
      })
      .build()
      .setVisible(true);
  });
}
