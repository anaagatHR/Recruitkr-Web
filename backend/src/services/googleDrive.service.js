import { env } from '../config/env.js';

/**
 * Copies candidate resumes into a Google Drive folder owned by a personal
 * Gmail account. OAuth with the narrow `drive.file` scope: the app can only
 * see files and folders it created, so a leaked token never exposes the rest
 * of that Drive. Credentials come from `node scripts/googleDriveSetup.js`.
 *
 * Plain fetch on purpose: token refresh + one multipart upload don't justify
 * the multi-megabyte googleapis package.
 */

const clientId = () => env.GOOGLE_DRIVE_CLIENT_ID || env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = () => env.GOOGLE_DRIVE_CLIENT_SECRET || env.GOOGLE_OAUTH_CLIENT_SECRET;

export const isDriveConfigured = () =>
  Boolean(clientId() && clientSecret() && env.GOOGLE_DRIVE_REFRESH_TOKEN && env.GOOGLE_DRIVE_RESUME_FOLDER_ID);

let cachedToken = null; // { value, expiresAt }

const getAccessToken = async () => {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId(),
      client_secret: clientSecret(),
      refresh_token: env.GOOGLE_DRIVE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    // invalid_grant = token revoked/expired (e.g. consent screen left in "Testing").
    throw new Error(`Drive token refresh failed: ${json.error || res.status} ${json.error_description || ''}`.trim());
  }
  // Refresh a minute early so a request never starts with a dying token.
  cachedToken = { value: json.access_token, expiresAt: Date.now() + (json.expires_in - 60) * 1000 };
  return cachedToken.value;
};

/** Upload one file into the resume folder; resolves with the Drive file id. */
export const uploadResumeToDrive = async ({ buffer, mimeType, fileName }) => {
  const token = await getAccessToken();
  const boundary = `recruitkr-${Date.now().toString(36)}`;
  const metadata = { name: fileName, parents: [env.GOOGLE_DRIVE_RESUME_FOLDER_ID] };
  // Drive's multipart upload is multipart/related (metadata part, then bytes), not form-data.
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\nContent-Type: ${mimeType || 'application/octet-stream'}\r\n\r\n`,
    ),
    buffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Drive upload failed: ${res.status} ${json.error?.message || ''}`.trim());
  return json.id;
};

/** "Asha Sharma - 9876543210 - 2026-11-01 - resume.pdf", safe for Drive. */
export const resumeDriveFileName = ({ name, mobile, originalName }) =>
  [name || 'Candidate', mobile, new Date().toISOString().slice(0, 10), originalName || 'resume']
    .filter(Boolean)
    .join(' - ')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .slice(0, 200);
