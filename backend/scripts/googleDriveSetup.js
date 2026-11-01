/**
 * One-time setup for copying candidate resumes into Google Drive.
 *
 * Signs in to the Gmail account that should own the resumes, creates the
 * "RecruitKr Candidate Resumes" folder in its Drive, and prints the four
 * lines to add to backend/.env (and to the Render service's environment).
 * Nothing is sent anywhere except Google; run it on your own computer.
 *
 * Before running (Google Cloud Console, same project as Google sign-in):
 *   1. APIs & Services → Library → enable "Google Drive API".
 *   2. OAuth consent screen → Publishing status "In production"
 *      (in "Testing", Google expires the refresh token after 7 days).
 *   3. Credentials → Create OAuth client ID → type "Desktop app".
 *      Put its id and secret in backend/.env as GOOGLE_DRIVE_CLIENT_ID and
 *      GOOGLE_DRIVE_CLIENT_SECRET.
 *
 * Usage (from backend/):  node scripts/googleDriveSetup.js
 */
import http from 'node:http';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const PORT = 53682;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`;
// Only files/folders this app creates: the rest of the Drive stays invisible to it.
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_NAME = 'RecruitKr Candidate Resumes';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET in backend/.env first (see the top of this file).');
  process.exit(1);
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.search = new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  response_type: 'code',
  scope: SCOPE,
  access_type: 'offline',
  prompt: 'consent', // always return a refresh token, even on a repeat run
}).toString();

const exchangeCode = async (code) => {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.refresh_token) {
    throw new Error(`Token exchange failed: ${json.error || res.status} ${json.error_description || ''}`);
  }
  return json;
};

const createFolder = async (accessToken) => {
  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Folder creation failed: ${res.status} ${json.error?.message || ''}`);
  return json;
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== '/oauth2callback') {
    res.writeHead(404).end();
    return;
  }
  const code = url.searchParams.get('code');
  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/plain' }).end(`Sign-in cancelled: ${url.searchParams.get('error') || 'no code'}`);
    server.close();
    return;
  }
  try {
    const tokens = await exchangeCode(code);
    const folder = await createFolder(tokens.access_token);
    res.writeHead(200, { 'Content-Type': 'text/plain' }).end('Done. You can close this tab and return to the terminal.');
    console.log(`\nCreated Drive folder "${FOLDER_NAME}": ${folder.webViewLink}`);
    console.log('You can rename or move it in Drive; the link keeps working.\n');
    console.log('Add these lines to backend/.env and to the Render service environment:\n');
    console.log(`GOOGLE_DRIVE_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log(`GOOGLE_DRIVE_RESUME_FOLDER_ID=${folder.id}\n`);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain' }).end(error.message);
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Open this link, sign in with the Gmail account that should own the resumes, and allow access:\n');
  console.log(`${authUrl}\n`);
});
