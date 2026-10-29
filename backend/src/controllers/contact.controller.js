import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

import { env } from '../config/env.js';
import { ContactMessage } from '../models/ContactMessage.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verify a Cloudflare Turnstile token. Returns true when Turnstile is not
 * configured (so the form keeps working on environments without the keys),
 * and when Cloudflare itself is unreachable — a CAPTCHA outage must not take
 * the contact form down with it; the rate limit and honeypot still apply.
 */
const verifyTurnstile = async (token, remoteIp) => {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: remoteIp }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const body = await response.json();
    return Boolean(body?.success);
  } catch (error) {
    console.warn('[contact] turnstile verification unavailable, allowing submission:', error.message);
    return true;
  }
};

export const createContactMessage = asyncHandler(async (req, res) => {
  const { website, turnstileToken, ...payload } = req.body;

  // Honeypot tripped: answer exactly like a success so the bot learns nothing,
  // but store nothing.
  if (website) {
    return res.status(StatusCodes.CREATED).json({ success: true, message: 'Message submitted', data: { id: null } });
  }

  const human = await verifyTurnstile(turnstileToken, req.ip);
  if (!human) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Verification failed. Please refresh the page and try again.');
  }

  const message = await ContactMessage.create(payload);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Message submitted',
    data: { id: message.id },
  });
});

export const listContactMessages = asyncHandler(async (_req, res) => {
  // Cap the admin inbox to the most recent messages so this can never load an
  // unbounded collection into memory on the small Render instance.
  const messages = await ContactMessage.find()
    .sort({ createdAt: -1, _id: -1 })
    .limit(500)
    .lean();

  res.json({
    success: true,
    data: messages.map((message) => ({
      ...message,
      status: message.status || 'unread',
      readAt: message.readAt || null,
    })),
  });
});

export const updateContactMessageStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid contact message id');
  }

  const update = {
    status,
    readAt: status === 'read' ? new Date() : null,
  };

  const message = await ContactMessage.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();

  if (!message) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Contact message not found');
  }

  res.json({
    success: true,
    message: 'Contact message updated',
    data: message,
  });
});

