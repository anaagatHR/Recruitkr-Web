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

export const contactLimiter = buildLimiter({
  max: env.CONTACT_RATE_LIMIT_MAX,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  message: 'Too many contact requests. Try again later.',
});

// RecruitKrBot is native (no external API) but still public — cap per-IP for abuse.
export const assistantLimiter = buildLimiter({
  max: 60,
  windowMs: 60 * 1000,
  message: 'You are sending messages too quickly. Please wait a moment.',
});

