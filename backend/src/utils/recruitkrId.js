import crypto from 'node:crypto';

// Crockford-ish alphabet without easily-confused characters (no 0/O, 1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const randomChunk = (length = 4) => {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
};

/**
 * Builds a human-readable, unique-ish candidate id of the form RKR-2026-8KJ3
 * (prefix + join year + 4 random unambiguous chars). Uniqueness is enforced by
 * the caller checking the DB and retrying on the rare collision.
 */
export const buildRecruitkrId = (year = new Date().getFullYear()) =>
  `RKR-${year}-${randomChunk(4)}`;
