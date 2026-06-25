import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { handleMessage } from '../services/assistant/engine.js';

const MAX_MESSAGE_CHARS = 1000;

/**
 * POST /api/v1/assistant/message  (public)
 * Body: { message: string, page?: string }
 * Returns: { data: { reply, intent, action?, suggestions, source } }
 *
 * Fully native — detects intent and answers from the in-memory knowledge base.
 * Never calls an external AI provider, never reads the database, never returns
 * private user data. Navigation `action`s only point at public app routes.
 */
export const handleAssistantMessage = asyncHandler(async (req, res) => {
  const message = String(req.body?.message ?? '').slice(0, MAX_MESSAGE_CHARS);
  const page = typeof req.body?.page === 'string' ? req.body.page.slice(0, 200) : undefined;

  if (!message.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'A message is required.');
  }

  const result = handleMessage({ message, page });
  res.json({ success: true, data: result });
});
