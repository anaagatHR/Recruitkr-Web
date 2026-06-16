import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

import { Application } from '../models/Application.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { uploadBufferToImageKit } from '../services/imagekit.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/** Shape a conversation for the requesting user (their unread count, the other party). */
const serializeConversation = (conv, role) => ({
  id: conv._id.toString(),
  applicationId: conv.applicationId ? conv.applicationId.toString() : null,
  jobId: conv.jobId ? conv.jobId.toString() : null,
  jobTitle: conv.jobTitle || '',
  companyName: conv.companyName || '',
  candidateName: conv.candidateName || '',
  // The label the current user sees for the other participant.
  withName: role === 'client' ? conv.candidateName || 'Candidate' : conv.companyName || 'Employer',
  lastMessage: conv.lastMessage || '',
  lastMessageAt: conv.lastMessageAt,
  lastSenderRole: conv.lastSenderRole,
  unread: role === 'candidate' ? conv.unreadForCandidate : conv.unreadForClient,
});

const serializeMessage = (msg, userId) => ({
  id: msg._id.toString(),
  conversationId: msg.conversationId.toString(),
  senderId: msg.senderId.toString(),
  senderRole: msg.senderRole,
  mine: msg.senderId.toString() === userId,
  body: msg.body || '',
  attachment: msg.attachment
    ? {
        url: msg.attachment.url,
        name: msg.attachment.name,
        type: msg.attachment.type,
        size: msg.attachment.size,
      }
    : null,
  createdAt: msg.createdAt,
});

/** Load a conversation and assert the requesting user is a participant. */
const loadMemberConversation = async (conversationId, user) => {
  if (!isValidId(conversationId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid conversation id');
  }
  const conv = await Conversation.findById(conversationId).exec();
  if (!conv) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Conversation not found');
  }
  const isMember =
    conv.candidateId.toString() === user.id || conv.clientId.toString() === user.id;
  if (!isMember) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You are not part of this conversation');
  }
  return conv;
};

export const listConversations = asyncHandler(async (req, res) => {
  const field = req.user.role === 'candidate' ? 'candidateId' : 'clientId';
  const conversations = await Conversation.find({ [field]: req.user.id })
    .sort({ lastMessageAt: -1 })
    .lean()
    .exec();

  res.json({
    success: true,
    data: conversations.map((c) => serializeConversation(c, req.user.role)),
  });
});

/**
 * Open (or reuse) a conversation. An employer starts it from an application;
 * a candidate can reopen one tied to an application they own.
 */
export const createConversation = asyncHandler(async (req, res) => {
  const { applicationId } = req.body;
  if (!isValidId(applicationId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'A valid applicationId is required');
  }

  const application = await Application.findById(applicationId).lean().exec();
  if (!application) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Application not found');
  }

  const candidateId = application.candidateId?.toString();
  const clientId = application.clientId?.toString();
  // Only the two parties on the application may open its conversation.
  if (req.user.id !== candidateId && req.user.id !== clientId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You cannot open this conversation');
  }

  const existing = await Conversation.findOne({ candidateId, clientId, applicationId }).exec();
  if (existing) {
    return res.json({ success: true, data: serializeConversation(existing, req.user.role) });
  }

  const conversation = await Conversation.create({
    candidateId,
    clientId,
    applicationId,
    jobId: application.jobId,
    jobTitle: application.sourceJobSnapshot?.jobTitle || application.appliedFor || '',
    companyName: application.sourceJobSnapshot?.companyName || '',
    candidateName: application.fullName || '',
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: serializeConversation(conversation, req.user.role),
  });
});

export const getMessages = asyncHandler(async (req, res) => {
  const conv = await loadMemberConversation(req.params.id, req.user);

  const messages = await Message.find({ conversationId: conv._id })
    .sort({ createdAt: 1 })
    .lean()
    .exec();

  // Opening the thread clears this user's unread counter and marks inbound as read.
  const unreadField = req.user.role === 'candidate' ? 'unreadForCandidate' : 'unreadForClient';
  if (conv[unreadField] > 0) {
    conv[unreadField] = 0;
    await conv.save();
    await Message.updateMany(
      { conversationId: conv._id, senderId: { $ne: req.user.id }, readAt: null },
      { $set: { readAt: new Date() } },
    ).exec();
  }

  res.json({
    success: true,
    data: {
      conversation: serializeConversation(conv, req.user.role),
      messages: messages.map((m) => serializeMessage(m, req.user.id)),
    },
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const conv = await loadMemberConversation(req.params.id, req.user);

  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';

  let attachment = null;
  if (req.file) {
    const asset = await uploadBufferToImageKit({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      folder: '/recruitkr/messages',
    });
    attachment = {
      url: asset.url,
      fileId: asset.fileId,
      name: asset.name || req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
    };
  }

  if (!body && !attachment) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Message text or a file is required');
  }

  const message = await Message.create({
    conversationId: conv._id,
    senderId: req.user.id,
    senderRole: req.user.role,
    body,
    attachment,
  });

  // Bump the conversation summary and the recipient's unread counter.
  const recipientUnreadField =
    req.user.role === 'candidate' ? 'unreadForClient' : 'unreadForCandidate';
  conv.lastMessage = body || `📎 ${attachment.name}`;
  conv.lastMessageAt = message.createdAt;
  conv.lastSenderRole = req.user.role;
  conv[recipientUnreadField] = (conv[recipientUnreadField] || 0) + 1;
  await conv.save();

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: serializeMessage(message, req.user.id),
  });
});
