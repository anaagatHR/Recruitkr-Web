import { StatusCodes } from 'http-status-codes';

import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/jwt.js';

const ACCESS_TOKEN_COOKIE_KEYS = ['accessToken', 'token', 'authToken'];

const getBearerToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }

  return null;
};

const getQueryToken = (req) => {
  if (typeof req.query?.token === 'string' && req.query.token.trim()) {
    return req.query.token.trim();
  }

  if (typeof req.query?.accessToken === 'string' && req.query.accessToken.trim()) {
    return req.query.accessToken.trim();
  }

  return null;
};

const getCookieToken = (req) => {
  for (const key of ACCESS_TOKEN_COOKIE_KEYS) {
    const value = req.cookies?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const resolveAccessToken = (req, { allowQueryToken = false } = {}) => {
  const bearerToken = getBearerToken(req);
  if (bearerToken) {
    return { token: bearerToken, source: 'authorization-header' };
  }

  if (allowQueryToken) {
    const queryToken = getQueryToken(req);
    if (queryToken) {
      return { token: queryToken, source: 'query-token' };
    }
  }

  const cookieToken = getCookieToken(req);
  if (cookieToken) {
    return { token: cookieToken, source: 'cookie' };
  }

  return { token: null, source: 'missing' };
};

const authenticateRequest = async (req, { allowQueryToken = false, context = 'api' } = {}) => {
  const { token, source } = resolveAccessToken(req, { allowQueryToken });

  console.info(`[auth] ${context} token source=${source} path=${req.originalUrl}`);
  if (!token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Missing authentication token');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    console.warn(`[auth] ${context} token verification failed source=${source} path=${req.originalUrl}`, {
      error: error instanceof Error ? error.message : error,
    });
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token');
  }

  const user = await User.findById(payload.sub).select('_id role passwordChangedAt');

  if (!user) {
    console.warn(`[auth] ${context} token subject not found source=${source} subject=${payload.sub}`);
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token subject');
  }

  if (
    user.passwordChangedAt &&
    payload.iat &&
    payload.iat * 1000 < new Date(user.passwordChangedAt).getTime() - 1000
  ) {
    console.warn(`[auth] ${context} token invalidated by password change userId=${user.id}`);
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Token expired due to password change');
  }

  req.user = { id: user.id, role: user.role };
  req.auth = { tokenSource: source };
  console.info(`[auth] ${context} authenticated userId=${user.id} role=${user.role} source=${source}`);
};

export const requireAuth = async (req, _res, next) => {
  try {
    await authenticateRequest(req, { allowQueryToken: false, context: 'api' });
    next();
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token'),
    );
  }
};

export const requireStreamAuth = async (req, _res, next) => {
  try {
    await authenticateRequest(req, { allowQueryToken: true, context: 'sse' });
    next();
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token'),
    );
  }
};

export const requireRole = (...allowedRoles) => (req, _res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    console.warn(
      `[auth] role rejected userId=${req.user?.id || 'anonymous'} role=${req.user?.role || 'none'} allowed=${allowedRoles.join(',')}`,
    );
    return next(new ApiError(StatusCodes.FORBIDDEN, 'Forbidden'));
  }
  return next();
};

