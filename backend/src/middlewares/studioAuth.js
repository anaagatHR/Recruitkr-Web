import crypto from 'node:crypto';

import { StatusCodes } from 'http-status-codes';

import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

import { requireAuth, requireRole } from './auth.js';

/**
 * Site Studio sign-in by PIN. The PIN lives only in the API's environment
 * (STUDIO_PIN), never in the Studio page or this repo. A right PIN returns a
 * signed Studio token for 8 hours; changing STUDIO_PIN cancels every token.
 * A website admin's normal login still works on all Studio routes too.
 */
const PREFIX = 'studio.';
const TTL_MS = 8 * 60 * 60 * 1000;
const LOCK_AFTER = 30; // wrong PINs from anywhere within LOCK_WINDOW_MS…
const LOCK_WINDOW_MS = 15 * 60 * 1000; // …lock PIN sign-in for the rest of the window

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const key = () => `${env.JWT_ACCESS_SECRET}:studio:${sha(env.STUDIO_PIN || '').toString('hex')}`;
const sign = (payload) => crypto.createHmac('sha256', key()).update(payload).digest('base64url');

export const STUDIO_USER_ID = 'studio-pin';

export const makeStudioToken = (now = Date.now()) => {
  const payload = Buffer.from(JSON.stringify({ exp: now + TTL_MS })).toString('base64url');
  return `${PREFIX}${payload}.${sign(payload)}`;
};

export const verifyStudioToken = (token, now = Date.now()) => {
  if (!env.STUDIO_PIN || typeof token !== 'string' || !token.startsWith(PREFIX)) return false;
  const [payload, mac] = token.slice(PREFIX.length).split('.');
  if (!payload || !mac) return false;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > now;
  } catch {
    return false;
  }
};

export const pinMatches = (pin) =>
  Boolean(env.STUDIO_PIN) &&
  typeof pin === 'string' &&
  crypto.timingSafeEqual(sha(pin.trim()), sha(env.STUDIO_PIN));

let failures = [];

/** POST /site-content/pin-login { pin } → { token, expiresInMs } */
export const pinLogin = asyncHandler(async (req, res) => {
  if (!env.STUDIO_PIN) {
    throw new ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      'PIN sign-in is off: STUDIO_PIN is not set on the API',
    );
  }
  const now = Date.now();
  failures = failures.filter((t) => now - t < LOCK_WINDOW_MS);
  if (failures.length >= LOCK_AFTER) {
    throw new ApiError(
      StatusCodes.TOO_MANY_REQUESTS,
      'Too many wrong PINs. Try again in 15 minutes.',
    );
  }
  if (!pinMatches(req.body?.pin)) {
    failures.push(now);
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Wrong PIN');
  }
  res.json({ success: true, data: { token: makeStudioToken(now), expiresInMs: TTL_MS } });
});

/** Every Studio route: a valid Studio (PIN) token, or a website admin's login. */
export const requireStudio = (req, res, next) => {
  const header = req.headers.authorization || '';
  if (header.startsWith(`Bearer ${PREFIX}`)) {
    if (!verifyStudioToken(header.slice(7).trim())) {
      return next(
        new ApiError(StatusCodes.UNAUTHORIZED, 'Studio session expired. Enter the PIN again.'),
      );
    }
    req.user = { id: STUDIO_USER_ID, role: 'admin' };
    req.auth = { tokenSource: 'studio-pin' };
    return next();
  }
  return requireAuth(req, res, (err) => (err ? next(err) : requireRole('admin')(req, res, next)));
};

/** Test hook: forget wrong-PIN history. */
export const resetPinFailures = () => {
  failures = [];
};
