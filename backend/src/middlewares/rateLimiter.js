import rateLimit from 'express-rate-limit';

import { env } from '../config/env.js';

const buildLimiter = ({ max, windowMs, message, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    message: { success: false, message },
  });

// Only failed requests count toward the global cap, so normal high-volume
// browsing by legit users is never throttled — only error/abuse bursts (e.g. a
// client retry-looping on an expired token) eat the budget.
export const globalLimiter = buildLimiter({
  max: env.RATE_LIMIT_MAX,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  skipSuccessfulRequests: true,
  message: 'Too many requests. Please retry later.',
});

export const authLimiter = buildLimiter({
  max: env.AUTH_RATE_LIMIT_MAX,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts. Try again later.',
});

// Per signed-in user (mount after requireAuth): one account can't spray
// applications or hammer profile saves from many IPs (audit Phase 8).
const perUserLimiter = ({ max, windowMs, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `user:${req.user.id}`,
    message: { success: false, code: 'RATE_LIMITED', message },
  });

export const applyLimiter = perUserLimiter({
  max: env.APPLY_RATE_LIMIT_MAX,
  windowMs: 60 * 60 * 1000,
  message: "You've sent a lot of applications in the last hour. Please try again a little later.",
});

export const profileWriteLimiter = perUserLimiter({
  max: env.PROFILE_WRITE_RATE_LIMIT_MAX,
  windowMs: 15 * 60 * 1000,
  message: 'Too many profile updates in a short time. Please wait a few minutes and try again.',
});

export const contactLimiter = buildLimiter({
  max: env.CONTACT_RATE_LIMIT_MAX,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  message: 'Too many contact requests. Try again later.',
});

