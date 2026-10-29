import argon2 from 'argon2';
import bcrypt from 'bcryptjs';

import { env } from '../config/env.js';

const withPepper = (value) => `${value}${env.BCRYPT_OR_ARGON2_PEPPER}`;

// New passwords use bcrypt so forgot/reset and registration share the same hashing strategy.
export const hashPassword = async (password) =>
  bcrypt.hash(withPepper(password), 12);

// Existing users may still have Argon2 hashes, so we support both during verification.
export const verifyPassword = async (hash, password) => {
  if (hash.startsWith('$argon2')) {
    return argon2.verify(hash, withPepper(password));
  }

  return bcrypt.compare(withPepper(password), hash);
};


/**
 * Only same-origin paths may be used as a post-login redirect. Anything that
 * could leave the site (absolute URLs, "//host", backslash tricks, control
 * characters) is dropped so the OAuth round-trip can't be turned into an
 * open redirect. Returns '' when the value is unusable.
 */
export const sanitizeRedirectPath = (value) => {
  if (typeof value !== 'string') return '';
  const candidate = value.trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.startsWith('/\\')) return '';
  if (/[\u0000-\u001f\u007f]/.test(candidate)) return '';
  try {
    const base = 'https://recruitkr.invalid';
    const parsed = new URL(candidate, base);
    if (parsed.origin !== base) return '';
    // "/jobs/..//evil.com" normalises to the pathname "//evil.com", which a
    // browser would then read as scheme-relative. Re-check after parsing.
    if (parsed.pathname.startsWith('//')) return '';
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '';
  }
};
