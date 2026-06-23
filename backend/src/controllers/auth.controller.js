import crypto from 'node:crypto';

import { StatusCodes } from 'http-status-codes';

import { env } from '../config/env.js';
import { CandidateProfile } from '../models/CandidateProfile.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { Resume } from '../models/Resume.js';
import { User } from '../models/User.js';
import { sendPasswordResetEmail } from '../services/mail.service.js';
import { buildGeneratedResumeData } from '../services/resume.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  generateJti,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/security.js';

const parseDurationToMs = (input) => {
  const match = /^(\d+)([smhd])$/.exec(input);
  if (!match) return 30 * 24 * 60 * 60 * 1000;

  const value = Number(match[1]);
  const unit = match[2];
  const factor = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
  return value * factor;
};

const getRefreshCookieOptions = () => {
  const isProduction = env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/v1/auth/refresh',
  };
};

const getAccessCookieOptions = () => {
  const isProduction = env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    ...getRefreshCookieOptions(),
    maxAge: parseDurationToMs(env.JWT_REFRESH_EXPIRES),
  });
};

const setAccessCookie = (res, accessToken) => {
  res.cookie('accessToken', accessToken, {
    ...getAccessCookieOptions(),
    maxAge: parseDurationToMs(env.JWT_ACCESS_EXPIRES),
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', getRefreshCookieOptions());
};

const clearAccessCookie = (res) => {
  res.clearCookie('accessToken', getAccessCookieOptions());
};

const clearAuthCookies = (res) => {
  clearRefreshCookie(res);
  clearAccessCookie(res);
};

const issueTokensAndPersistRefresh = async (user) => {
  const jti = generateJti();
  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role, jti });

  user.refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenJti = jti;
  user.refreshTokenExpiresAt = new Date(
    Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES),
  );
  await user.save();

  return { accessToken, refreshToken };
};

const buildResetPasswordUrl = (token) => {
  const base = env.FRONTEND_URL.replace(/\/$/, '');
  return `${base}/reset-password/${encodeURIComponent(token)}`;
};

const syncCandidateLegacyFields = ({ profile, user, resumeLocation = '' }) => {
  const summary = profile.summary || '';
  const preferredLocation = profile.preferences?.preferredLocation || '';
  const preferredIndustry = profile.preferences?.preferredIndustry || '';
  const preferredRole = profile.preferences?.preferredRole || '';
  const workModes = profile.preferences?.workModes || [];

  profile.about = summary;
  profile.city = preferredLocation;
  profile.currentCity = preferredLocation;
  profile.email = user?.email || profile.email || '';
  profile.isActive = true;
  profile.mobile = user?.mobile || profile.mobile || '';
  profile.name = profile.fullName || '';
  profile.phone = user?.mobile || profile.phone || '';
  profile.preferredIndustry = preferredIndustry;
  profile.preferredLocation = preferredLocation;
  profile.preferredRole = preferredRole;
  profile.resumePath = resumeLocation || profile.resumePath || '';
  profile.workModes = workModes;
};

const syncClientLegacyFields = ({ profile, user }) => {
  const companyName = profile.companyName || '';
  const spocName = profile.spoc?.name || '';
  const spocMobile = profile.spoc?.mobile || user?.mobile || '';
  const spocEmail = profile.spoc?.email || user?.email || '';
  const city = profile.billing?.billingAddress?.split(/\r?\n/)[0] || '';

  profile.city = city;
  profile.company = companyName;
  profile.contactName = spocName;
  profile.description = profile.description || '';
  profile.email = user?.email || profile.email || '';
  profile.location = city;
  profile.mobile = spocMobile;
  profile.name = spocName;
  profile.phone = spocMobile;
  profile.requirements = profile.requirements || '';
  profile.website = profile.companyWebsite || '';
};

const getRoleLabel = (role) => {
  if (role === 'client') return 'Employer';
  if (role === 'candidate') return 'Candidate';
  if (role === 'admin') return 'Admin';
  return 'User';
};

const normalizeUrl = (value) => value.replace(/\/$/, '');

const buildOAuthState = ({ role, redirect }) =>
  Buffer.from(JSON.stringify({ role, redirect }), 'utf8').toString('base64url');

const parseOAuthState = (state) => {
  if (!state) return {};

  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    return {
      role: parsed?.role === 'client' || parsed?.role === 'candidate' ? parsed.role : undefined,
      redirect: typeof parsed?.redirect === 'string' ? parsed.redirect : undefined,
    };
  } catch {
    return {};
  }
};

// One-time OAuth handoff codes. After Google sign-in we redirect the browser
// with a short-lived, single-use CODE instead of the tokens themselves — URLs
// leak via server access logs, browser history and Referer headers, so putting
// a 30-day refresh token there is unsafe. The frontend trades this code for
// real tokens over a POST (see exchangeOAuthCode), where they stay in the body.
const OAUTH_CODE_TTL_MS = 2 * 60 * 1000;
const oauthHandoffCodes = new Map(); // code -> { userId, expiresAt }

const createOAuthHandoffCode = (userId) => {
  const code = crypto.randomBytes(32).toString('base64url');
  oauthHandoffCodes.set(code, { userId, expiresAt: Date.now() + OAUTH_CODE_TTL_MS });
  return code;
};

const consumeOAuthHandoffCode = (code) => {
  const entry = oauthHandoffCodes.get(code);
  if (!entry) return null;
  oauthHandoffCodes.delete(code); // single use: invalidate immediately
  if (entry.expiresAt < Date.now()) return null;
  return entry;
};

// Drop expired codes periodically so the map can't grow unbounded. unref() so
// this timer never keeps the process alive on shutdown.
setInterval(() => {
  const now = Date.now();
  for (const [code, entry] of oauthHandoffCodes) {
    if (entry.expiresAt < now) oauthHandoffCodes.delete(code);
  }
}, OAUTH_CODE_TTL_MS).unref?.();

const buildFrontendOAuthSuccessUrl = ({ code, role, redirect }) => {
  const url = new URL(`${normalizeUrl(env.FRONTEND_URL)}/login`);
  url.searchParams.set('oauth', 'success');
  url.searchParams.set('code', code);
  // role is not sensitive; it just lets the UI pre-select the right tab.
  if (role) url.searchParams.set('role', role);
  if (redirect) url.searchParams.set('redirect', redirect);
  return url.toString();
};

// Redirect the browser back to the login page with a friendly error code instead
// of rendering raw JSON. `reason` is a short, non-sensitive machine code the UI
// maps to a human message; we never expose internal error details to the user.
const buildFrontendErrorUrl = ({ reason, role, redirect }) => {
  const url = new URL(`${normalizeUrl(env.FRONTEND_URL)}/login`);
  url.searchParams.set('oauth', 'error');
  url.searchParams.set('reason', reason || 'failed');
  if (role) url.searchParams.set('role', role);
  if (redirect) url.searchParams.set('redirect', redirect);
  return url.toString();
};

const buildGoogleOAuthUrl = ({ role, redirect }) => {
  if (!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET) {
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Google login is disabled.');
  }

  const state = buildOAuthState({ role, redirect });
  const callbackUrl =
    env.GOOGLE_OAUTH_REDIRECT_URI ||
    `${normalizeUrl(env.FRONTEND_URL)}/api/v1/auth/google/callback`;

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', env.GOOGLE_OAUTH_CLIENT_ID);
  url.searchParams.set('redirect_uri', callbackUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
};

const exchangeGoogleCode = async (code, redirectUri) => {
  const body = new URLSearchParams({
    client_id: env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    console.warn('[oauth] google token exchange failed', { status: response.status, bodyText });
    // Parse Google's { error, error_description } so we can map it to a precise,
    // developer-actionable reason instead of a generic failure.
    let googleCode = '';
    try {
      googleCode = JSON.parse(bodyText)?.error || '';
    } catch {
      googleCode = '';
    }
    const error = new ApiError(StatusCodes.BAD_GATEWAY, 'Google sign-in failed during token exchange.');
    error.googleCode = googleCode;
    throw error;
  }

  return response.json();
};

const fetchGoogleProfile = async (accessToken) => {
  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    console.warn('[oauth] google profile lookup failed', { status: response.status, bodyText });
    throw new ApiError(StatusCodes.BAD_GATEWAY, 'Google sign-in failed while reading profile.');
  }

  return response.json();
};

// Google sign-in creates a User but, historically, no matching profile, which
// later caused "Client/Candidate profile not found" on the dashboard. Ensure the
// role-appropriate profile exists for both new and pre-existing Google accounts
// (existing broken accounts self-heal on their next login).
const ensureProfileForUser = async (user) => {
  if (user.role === 'client') {
    const existing = await ClientProfile.findOne({ userId: user.id }).select('_id').lean();
    if (!existing) {
      await ClientProfile.create({ userId: user.id });
    }
    return;
  }

  if (user.role === 'candidate') {
    const existing = await CandidateProfile.findOne({ userId: user.id }).select('_id').lean();
    if (!existing) {
      await CandidateProfile.create({ userId: user.id, email: user.email, isActive: true });
    }
  }
};

const upsertGoogleUser = async ({ email, googleId, role }) => {
  let user = await User.findOne({ email })
    .select('+passwordHash +refreshTokenHash +refreshTokenJti +refreshTokenExpiresAt +authProvider +authProviderId')
    .exec();

  if (user && user.role !== role) {
    const error = new ApiError(
      StatusCodes.UNAUTHORIZED,
      `This email is registered as ${getRoleLabel(user.role)}. Please choose the correct login type.`,
    );
    error.oauthReason = 'role_mismatch';
    error.registeredRole = user.role;
    throw error;
  }

  if (!user) {
    const passwordHash = await hashPassword(crypto.randomBytes(24).toString('hex'));
    user = await User.create({
      role,
      email,
      passwordHash,
      passwordChangedAt: new Date(),
      authProvider: 'google',
      authProviderId: googleId,
    });
    await ensureProfileForUser(user);
    return user;
  }

  if (!user.authProvider) user.authProvider = 'google';
  user.authProviderId = googleId;
  await user.save();
  await ensureProfileForUser(user);
  return user;
};

export const registerCandidate = asyncHandler(async (req, res) => {
  const payload = req.body;

  const existing = await User.findOne({ email: payload.email });
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email already registered');
  }

  const passwordHash = await hashPassword(payload.password);

  const user = await User.create({
    role: 'candidate',
    email: payload.email,
    mobile: payload.mobile,
    passwordHash,
    passwordChangedAt: new Date(),
  });

  const candidateProfile = await CandidateProfile.create({
    userId: user.id,
    fullName: payload.fullName,
    dateOfBirth: payload.dateOfBirth,
    gender: payload.gender,
    address: payload.address,
    pincode: payload.pincode,
    linkedinUrl: payload.linkedinUrl,
    portfolioUrl: payload.portfolioUrl,
    highestQualification: payload.highestQualification,
    experienceStatus: payload.experienceStatus,
    experienceDetails: payload.experienceDetails,
    preferences: payload.preferences,
    about: payload.summary || '',
    city: payload.preferences?.preferredLocation || '',
    currentCity: payload.preferences?.preferredLocation || '',
    email: payload.email,
    isActive: true,
    mobile: payload.mobile,
    name: payload.fullName,
    phone: payload.mobile,
    preferredIndustry: payload.preferences?.preferredIndustry || '',
    preferredLocation: payload.preferences?.preferredLocation || '',
    preferredRole: payload.preferences?.preferredRole || '',
    workModes: payload.preferences?.workModes || [],
    declarationAccepted: payload.declarationAccepted,
    representationAuthorized: payload.representationAuthorized,
  });

  const generatedResumeData =
    payload.resumeType === 'generated'
      ? buildGeneratedResumeData({
          ...payload,
          skills: payload.resumeData?.skills,
        })
      : null;

  // A resume is optional at registration; only create one when the candidate
  // supplied an uploaded file or asked us to generate one from form details.
  if (payload.resumeType) {
    await Resume.create({
      candidateUserId: user.id,
      resumeType: payload.resumeType,
      resumeUrl: payload.resumeType === 'uploaded' ? payload.resumeUrl : '',
      resumeFileId: payload.resumeType === 'uploaded' ? payload.resumeFileId : '',
      resumeFileName: payload.resumeType === 'uploaded' ? payload.resumeFileName || '' : '',
      resumeData: payload.resumeType === 'generated' ? generatedResumeData : undefined,
    });
  }

  syncCandidateLegacyFields({
    profile: candidateProfile,
    user,
    resumeLocation:
      payload.resumeType === 'uploaded'
        ? payload.resumeUrl
        : payload.resumeType === 'generated'
          ? 'generated'
          : '',
  });
  await candidateProfile.save();

  const tokens = await issueTokensAndPersistRefresh(user);
  setAccessCookie(res, tokens.accessToken);
  setRefreshCookie(res, tokens.refreshToken);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Candidate registered successfully',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
      profileId: candidateProfile.id,
      resumeType: payload.resumeType,
    },
  });
});

export const registerClient = asyncHandler(async (req, res) => {
  const payload = req.body;

  const existing = await User.findOne({ email: payload.email });
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email already registered');
  }

  const passwordHash = await hashPassword(payload.password);
  const user = await User.create({
    role: 'client',
    email: payload.email,
    mobile: payload.mobile,
    passwordHash,
    passwordChangedAt: new Date(),
  });

  const clientProfile = await ClientProfile.create({
    userId: user.id,
    companyName: payload.companyName,
    industry: payload.industry,
    companyWebsite: payload.companyWebsite,
    companySize: payload.companySize,
    companyType: payload.companyType,
    spoc: payload.spoc,
    commercial: payload.commercial,
    billing: payload.billing,
    declarationAccepted: payload.declarationAccepted,
  });

  syncClientLegacyFields({ profile: clientProfile, user });
  await clientProfile.save();

  const tokens = await issueTokensAndPersistRefresh(user);
  setAccessCookie(res, tokens.accessToken);
  setRefreshCookie(res, tokens.refreshToken);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Client registered successfully',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  const user = await User.findOne({ email })
    .select('+passwordHash +refreshTokenHash +refreshTokenJti +refreshTokenExpiresAt +authProvider')
    .exec();

  if (!user) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'This account is not registered. Please sign up first.',
    );
  }

  if (user.role !== role) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      `This email is registered as ${getRoleLabel(user.role)}. Please choose the correct login type.`,
    );
  }

  // Google-registered accounts have no real password (a random one was set), so
  // email/password login would always "not match". Guide them to Google instead.
  if (user.authProvider === 'google') {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'This account uses Google sign-in. Please click "Continue with Google" to log in.',
    );
  }

  const passwordOk = await verifyPassword(user.passwordHash, password);
  if (!passwordOk) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Incorrect password. Please try again.');
  }

  const tokens = await issueTokensAndPersistRefresh(user);
  setAccessCookie(res, tokens.accessToken);
  setRefreshCookie(res, tokens.refreshToken);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    },
  });
});

export const googleStart = asyncHandler(async (req, res) => {
  const role = req.query.role === 'client' ? 'client' : 'candidate';
  const redirect = typeof req.query.redirect === 'string' ? req.query.redirect : '';
  const oauthUrl = buildGoogleOAuthUrl({ role, redirect });
  console.info('[oauth] google start', { role, hasRedirect: Boolean(redirect) });
  res.redirect(oauthUrl);
});

export const googleCallback = asyncHandler(async (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const { role, redirect } = parseOAuthState(
    typeof req.query.state === 'string' ? req.query.state : '',
  );

  const resolvedRole = role || 'candidate';
  const safeRedirect = typeof redirect === 'string' && redirect ? redirect : undefined;
  const googleError = typeof req.query.error === 'string' ? req.query.error : '';
  const callbackUrl =
    env.GOOGLE_OAUTH_REDIRECT_URI ||
    `${normalizeUrl(env.FRONTEND_URL)}/api/v1/auth/google/callback`;

  // Send the user back to the login page with a friendly error code rather than
  // dumping JSON. This covers user-cancelled consent, missing code, disabled
  // login, and any token/profile failure during the exchange.
  const failRedirect = (reason) => {
    clearAuthCookies(res);
    return res.redirect(buildFrontendErrorUrl({ reason, role: resolvedRole, redirect: safeRedirect }));
  };

  // Google appends ?error=access_denied (etc.) when the user cancels consent.
  if (googleError) {
    console.info('[oauth] google callback declined', { error: googleError });
    return failRedirect(googleError === 'access_denied' ? 'cancelled' : 'failed');
  }

  if (!code) {
    console.info('[oauth] google callback without code');
    return failRedirect('cancelled');
  }

  if (!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return failRedirect('disabled');
  }

  try {
    console.info('[oauth] google callback', { role: resolvedRole });
    const tokenData = await exchangeGoogleCode(code, callbackUrl);
    const profile = await fetchGoogleProfile(tokenData.access_token);
    const email = typeof profile.email === 'string' ? profile.email.trim().toLowerCase() : '';
    const googleId = typeof profile.sub === 'string' ? profile.sub : '';

    if (!email || !googleId) {
      return failRedirect('profile');
    }

    const user = await upsertGoogleUser({ email, googleId, role: resolvedRole });

    // Hand off via a one-time code, NOT tokens in the URL. Tokens are minted
    // when the frontend exchanges this code (see exchangeOAuthCode).
    const handoffCode = createOAuthHandoffCode(user.id);

    return res.redirect(
      buildFrontendOAuthSuccessUrl({
        code: handoffCode,
        role: user.role,
        redirect: safeRedirect,
      }),
    );
  } catch (error) {
    // Log the real cause server-side; map known Google error codes to a precise
    // reason so the developer sees what to fix (config issues are common in dev).
    const googleCode = error?.googleCode || '';
    console.warn('[oauth] google callback failed', {
      message: error instanceof Error ? error.message : String(error),
      googleCode,
      oauthReason: error?.oauthReason,
    });

    // Same Google email already bound to the other role: tell the user clearly.
    if (error?.oauthReason === 'role_mismatch') {
      return failRedirect(
        error.registeredRole === 'client' ? 'role_client' : 'role_candidate',
      );
    }

    const reasonByCode = {
      redirect_uri_mismatch: 'redirect_mismatch',
      invalid_client: 'config',
      unauthorized_client: 'config',
      invalid_grant: 'expired',
    };
    return failRedirect(reasonByCode[googleCode] || 'failed');
  }
});

// Trades a one-time OAuth handoff code (from the Google callback redirect) for
// real tokens. Tokens travel in the JSON body, never the URL. The code is
// single-use and short-lived, so even if it lands in a log it is useless once
// consumed or after a couple of minutes.
export const exchangeOAuthCode = asyncHandler(async (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
  if (!code) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing sign-in code.');
  }

  const entry = consumeOAuthHandoffCode(code);
  if (!entry) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'This sign-in link has expired. Please sign in again.',
    );
  }

  const user = await User.findById(entry.userId)
    .select('+refreshTokenHash +refreshTokenJti +refreshTokenExpiresAt')
    .exec();
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Account not found. Please sign in again.');
  }

  const tokens = await issueTokensAndPersistRefresh(user);
  setAccessCookie(res, tokens.accessToken);
  setRefreshCookie(res, tokens.refreshToken);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const suppliedToken = req.body.refreshToken || req.cookies?.refreshToken;
  if (!suppliedToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Missing refresh token');
  }

  try {
    const payload = verifyRefreshToken(suppliedToken);
    const user = await User.findById(payload.sub)
      .select('+refreshTokenHash +refreshTokenJti +refreshTokenExpiresAt')
      .exec();

    if (!user || !user.refreshTokenHash || !user.refreshTokenJti) {
      console.warn('[auth] refresh rejected: missing persisted token state', { userId: payload.sub });
      clearAuthCookies(res);
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
    }

    if (payload.jti !== user.refreshTokenJti) {
      console.warn('[auth] refresh rejected: rotation mismatch', { userId: payload.sub });
      clearAuthCookies(res);
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token rotation detected');
    }

    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt.getTime() < Date.now()) {
      console.warn('[auth] refresh rejected: token expired', { userId: payload.sub });
      clearAuthCookies(res);
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token expired');
    }

    if (hashToken(suppliedToken) !== user.refreshTokenHash) {
      console.warn('[auth] refresh rejected: hash mismatch', { userId: payload.sub });
      clearAuthCookies(res);
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
    }

    const tokens = await issueTokensAndPersistRefresh(user);
    setRefreshCookie(res, tokens.refreshToken);

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    clearAuthCookies(res);
    if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired refresh token');
    }
    throw error;
  }
});

export const logout = asyncHandler(async (req, res) => {
  const suppliedToken = req.body?.refreshToken || req.cookies?.refreshToken;
  if (suppliedToken) {
    try {
      const payload = verifyRefreshToken(suppliedToken);
      const user = await User.findById(payload.sub)
        .select('+refreshTokenHash +refreshTokenJti +refreshTokenExpiresAt')
        .exec();
      if (user) {
        user.refreshTokenHash = undefined;
        user.refreshTokenJti = undefined;
        user.refreshTokenExpiresAt = undefined;
        await user.save();
      }
    } catch (_error) {
      console.warn('[auth] logout ignored invalid refresh token');
    }
  }

  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+passwordHash').exec();

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const ok = await verifyPassword(user.passwordHash, currentPassword);
  if (!ok) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Current password is incorrect');
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  user.refreshTokenHash = undefined;
  user.refreshTokenJti = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();

  clearAccessCookie(res);
  clearRefreshCookie(res);
  res.json({ success: true, message: 'Password updated. Please log in again.' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email })
    .select('+resetToken +resetTokenExpire')
    .exec();

  if (user) {
    // Generate a cryptographically strong token for the reset link and hash it before saving.
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = hashToken(rawToken);
    user.resetTokenExpire = new Date(Date.now() + env.PASSWORD_RESET_EXPIRES_MIN * 60 * 1000);
    await user.save();

    const resetUrl = buildResetPasswordUrl(rawToken);

    try {
      await sendPasswordResetEmail({
        to: email,
        resetUrl,
        expiresInMinutes: env.PASSWORD_RESET_EXPIRES_MIN,
      });
    } catch (error) {
      console.error('Password reset email failed:', error);

      if (env.NODE_ENV !== 'production') {
        throw new ApiError(
          StatusCodes.BAD_GATEWAY,
          'Unable to send reset email in development. Check the Resend configuration.',
        );
      }
    }
  }

  // Always return success to prevent account enumeration.
  res.json({
    success: true,
    message: 'If an account exists for this email, a password reset link has been sent.',
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  const tokenHash = hashToken(token);

  // Only accept a matching hashed token that has not expired.
  const user = await User.findOne({
    resetToken: tokenHash,
    resetTokenExpire: { $gt: new Date() },
  })
    .select('+passwordHash +resetToken +resetTokenExpire +refreshTokenHash +refreshTokenJti +refreshTokenExpiresAt')
    .exec();

  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid or expired reset token');
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  user.resetToken = undefined;
  user.resetTokenExpire = undefined;
  user.refreshTokenHash = undefined;
  user.refreshTokenJti = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();

  clearAccessCookie(res);
  clearRefreshCookie(res);
  res.json({ success: true, message: 'Password reset successful. Please log in again.' });
});
