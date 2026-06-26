import crypto from 'node:crypto';

import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

const logJwtError = (action, error, tokenKind) => {
  console.warn(`[jwt] ${action} failed for ${tokenKind}`, {
    name: error instanceof Error ? error.name : 'unknown',
    message: error instanceof Error ? error.message : String(error),
  });
};

// Pin the signing algorithm everywhere. Verifying with an explicit allowlist
// prevents algorithm-confusion attacks (e.g. a forged token claiming alg:none
// or an asymmetric alg) — the verifier will only ever accept HS256.
const JWT_ALG = 'HS256';

export const signAccessToken = ({ userId, role }) =>
  jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, {
    algorithm: JWT_ALG,
    expiresIn: env.JWT_ACCESS_EXPIRES,
  });

export const signRefreshToken = ({ userId, role, jti }) =>
  jwt.sign({ sub: userId, role, jti }, env.JWT_REFRESH_SECRET, {
    algorithm: JWT_ALG,
    expiresIn: env.JWT_REFRESH_EXPIRES,
  });

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: [JWT_ALG] });
  } catch (error) {
    logJwtError('verifyAccessToken', error, 'access token');
    throw error;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, { algorithms: [JWT_ALG] });
  } catch (error) {
    logJwtError('verifyRefreshToken', error, 'refresh token');
    throw error;
  }
};

export const generateJti = () => crypto.randomUUID();

export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

