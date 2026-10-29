import { env } from './env.js';

// The browser origins allowed to call this API — shared by CORS (app.js) and
// the CSRF origin check for cookie-authenticated writes (middlewares/auth.js).
const parseOrigins = (value = '') =>
  value
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

const localDevOrigins = ['http://localhost:3000'];

export const allowedOrigins = new Set([
  ...parseOrigins(env.CORS_ORIGIN),
  env.FRONTEND_URL.replace(/\/$/, ''),
  ...(env.NODE_ENV === 'production' ? [] : localDevOrigins),
]);
