import { Router } from 'express';

import {
  changePassword,
  forgotPassword,
  googleCallback,
  googleStart,
  login,
  logout,
  oauthExchange,
  refresh,
  registerCandidate,
  registerClient,
  resetPassword,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { validate } from '../middlewares/validate.js';
import {
  candidateRegisterSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  clientRegisterSchema,
  loginSchema,
  refreshSchema,
  resetPasswordParamsSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema.js';

const router = Router();

// Registration
router.post('/register/candidate', authLimiter, validate(candidateRegisterSchema), registerCandidate);
router.post('/register/client', authLimiter, validate(clientRegisterSchema), registerClient);

// Login — authLimiter caps repeated failed attempts (brute-force protection);
// successful logins are skipped so normal users aren't throttled.
router.post('/login', authLimiter, validate(loginSchema), login);

// Google OAuth
router.get('/google', googleStart);
router.get('/google/callback', googleCallback);
router.post('/oauth/exchange', oauthExchange);

// Token refresh/logout
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', logout);

// Password management
router.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  changePassword,
);

router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);

router.post(
  '/reset-password/:token',
  authLimiter,
  validate(resetPasswordParamsSchema, 'params'),
  validate(resetPasswordSchema),
  resetPassword,
);

export default router;