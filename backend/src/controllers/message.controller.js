import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

import { Application } from '../models/Application.js';
import { CandidateProfile } from '../models/CandidateProfile.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { buildCandidateSnapshot } from '../services/conversation.service.js';
import { uploadBufferToImageKit } from '../services/imagekit.js';
import { isUserOnline, publishLiveUpdate } from '../services/liveUpdate.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/** The id + role of the participant who is NOT the requesting user. */
const otherParty = (conv, user) => {
  const candidateId = conv.candidateId.toString();
  const clientId = conv.clientId.toString();
  if (user.id === candidateId) return { id: clientId, role: 'client' };
  return { id: candidateId, role: 'candidate' };
};

/**
 * Shape a conversation for the requesting user (unread count, other party,
 * presence). `extra` carries read-time enrichment that the denormalised
 * snapshot can't keep fresh: live application `status`, the employer's
 * `companyLogoUrl`, and the candidate's current `videos`.
 */
const serializeConversation = (conv, user, extra = {}) => {
  const role = user.role;
  const other = otherParty(conv, user);
  const snapshot = conv.candidateSnapshot || {};
  // Prefer live videos when provided, else fall back to the apply-time snapshot.
  const videos = Array.isArray(extra.videos) ? extra.videos : snapshot.videos || [];

  return {
    id: conv._id.toString(),
    applicationId: conv.applicationId ? conv.applicationId.toString() : null,
    jobId: conv.jobId ? conv.jobId.toString() : null,
    jobTitle: conv.jobTitle || '',
    companyName: conv.companyName || '',
    companyLogoUrl: extra.companyLogoUrl || '',
    status: extra.status || '',
    candidateName: conv.candidateName || snapshot.fullName || '',
    // Full candidate profile snapshot for the chat header / details panel.
    candidate: {
      fullName: snapshot.fullName || conv.candidateName || '',
      email: snapshot.email || '',
      phone: snapshot.phone || '',
      photoUrl: snapshot.photoUrl || '',
      qualification: snapshot.qualification || '',
      skills: snapshot.skills || [],
      experience: snapshot.experience || '',
      preferredLocation: snapshot.preferredLocation || '',
      portfolioUrl: snapshot.portfolioUrl || '',
      linkedinUrl: snapshot.linkedinUrl || '',
      resumeUrl: snapshot.resumeUrl || '',
      videos: videos.map((v) => ({ url: v.url, name: v.name || 'Video', type: v.type || '' })),
      appliedFor: snapshot.appliedFor || conv.jobTitle || '',
      appliedAt: snapshot.appliedAt || conv.createdAt,
    },
    // The label/photo the current user sees for the other participant.
    withName:
      role === 'client'
        ? conv.candidateName || snapshot.fullName || 'Candidate'
        : conv.companyName || 'Employer',
    withPhotoUrl: role === 'client' ? snapshot.photoUrl || '' : extra.companyLogoUrl || '',
    withUserId: other.id,
    online: isUserOnline(other.id),
    lastMessage: conv.lastMessage || '',
    lastMessageAt: conv.lastMessageAt,
    lastSenderRole: conv.lastSenderRole,
    unread: role === 'candidate' ? conv.unreadForCandidate : conv.unreadForClient,
  };
};

const messageStatus = (msg) => {
  if (msg.readAt) return 'read';
  if (msg.deliveredAt) return 'delivered';
  return 'sent';
};

const serializeMessage = (msg, userId) => ({
  id: msg._id.toString(),
  conversationId: msg.conversationId.toString(),
  senderId: msg.senderId.toString(),
  senderRole: msg.senderRole,
  messageType: msg.messageType || 'text',
  system: msg.senderRole === 'system',
  mine: msg.senderRole !== 'system' && msg.senderId.toString() === userId,
  body: msg.body || '',
  attachment: msg.attachment
    ? {
        url: msg.attachment.url,
        name: msg.attachment.name,
        type: msg.attachment.type,
        size: msg.attachment.size,
      }
    : null,
  meta: msg.meta || null,
  status: messageStatus(msg),
  deliveredAt: msg.deliveredAt || null,
  readAt: msg.readAt || null,
  createdAt: msg.createdAt,
});

/** Read-time enrichment (status/logo/videos) for a single conversation. */
const conversationExtra = async (conv, user) => {
  const [application, clientProfile, candidateProfile] = await Promise.all([
    conv.applicationId
      ? Application.findById(conv.applicationId).select('status').lean().exec()
      : null,
    ClientProfile.findOne({ userId: conv.clientId }).select('profileImage').lean().exec(),
    user.role === 'client'
      ? CandidateProfile.findOne({ userId: conv.candidateId }).select('videos').lean().exec()
      : null,
  ]);

  return {
    status: application?.status || '',
    companyLogoUrl: clientProfile?.profileImage?.url || '',
    videos: candidateProfile?.videos,
  };
};

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

  // Read-time enrichment so cards/headers stay fresh regardless of the
  // apply-time snapshot: live application status, employer logo, candidate videos.
  const applicationIds = conversations.map((c) => c.applicationId).filter(Boolean);
  const clientIds = [...new Set(conversations.map((c) => c.clientId?.toString()).filter(Boolean))];
  const candidateIds = [...new Set(conversations.map((c) => c.candidateId?.toString()).filter(Boolean))];

  const [applications, clientProfiles, candidateProfiles] = await Promise.all([
    applicationIds.length
      ? Application.find({ _id: { $in: applicationIds } }).select('status').lean().exec()
      : [],
    clientIds.length
      ? ClientProfile.find({ userId: { $in: clientIds } }).select('userId profileImage').lean().exec()
      : [],
    // Only the employer needs the candidate's live videos.
    req.user.role === 'client' && candidateIds.length
      ? CandidateProfile.find({ userId: { $in: candidateIds } }).select('userId videos').lean().exec()
      : [],
  ]);

  const statusByApp = new Map(applications.map((a) => [a._id.toString(), a.status]));
  const logoByClient = new Map(
    clientProfiles.map((p) => [p.userId.toString(), p.profileImage?.url || '']),
  );
  const videosByCandidate = new Map(
    candidateProfiles.map((p) => [p.userId.toString(), p.videos || []]),
  );

  res.json({
    success: true,
    data: conversations.map((c) =>
      serializeConversation(c, req.user, {
        status: c.applicationId ? statusByApp.get(c.applicationId.toString()) : '',
        companyLogoUrl: logoByClient.get(c.clientId?.toString()) || '',
        videos: videosByCandidate.get(c.candidateId?.toString()),
      }),
    ),
  });
});

/**
 * Backward-compatible manual open/reuse. The primary flow now auto-creates the
 * conversation on apply, but this still lets a participant resolve the thread
 * tied to an application by id (e.g. deep links from older clients).
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
  if (req.user.id !== candidateId && req.user.id !== clientId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You cannot open this conversation');
  }

  const existing = await Conversation.findOne({ candidateId, clientId, applicationId }).exec();
  if (existing) {
    return res.json({ success: true, data: serializeConversation(existing, req.user) });
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
    data: serializeConversation(conversation, req.user),
  });
});

/**
 * Recruiter starts (or reopens) a direct chat with a candidate straight from the
 * candidate search — no prior application required. One direct thread per
 * candidate/client pair (applicationId stays unset).
 */
export const createDirectConversation = asyncHandler(async (req, res) => {
  if (req.user.role !== 'client') {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only employers can start a direct chat');
  }
  const { candidateId } = req.body || {};
  if (!isValidId(candidateId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'A valid candidateId is required');
  }

  const candidateUser = await User.findById(candidateId).select('_id role email mobile').lean().exec();
  if (!candidateUser || candidateUser.role !== 'candidate') {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Candidate not found');
  }

  const clientId = req.user.id;

  // Reuse the existing direct thread (applicationId unset) if present.
  let conversation = await Conversation.findOne({
    candidateId,
    clientId,
    applicationId: { $exists: false },
  }).exec();

  let isNew = false;
  if (!conversation) {
    const candidateProfile = await CandidateProfile.findOne({ userId: candidateId }).lean().exec();
    const snapshot = buildCandidateSnapshot({
      candidateUser,
      candidateProfile,
      resume: null,
      appliedFor: '',
      appliedAt: new Date(),
    });
    try {
      conversation = await Conversation.create({
        candidateId,
        clientId,
        candidateName: snapshot.fullName || candidateProfile?.fullName || '',
        candidateSnapshot: snapshot,
        lastSenderRole: 'system',
      });
      isNew = true;
    } catch (error) {
      // A concurrent request may have created it first — re-read and reuse.
      if (error?.code === 11000) {
        conversation = await Conversation.findOne({
          candidateId,
          clientId,
          applicationId: { $exists: false },
        }).exec();
      } else {
        throw error;
      }
    }
  }

  if (!conversation) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Could not start the conversation');
  }

  res
    .status(isNew ? StatusCodes.CREATED : StatusCodes.OK)
    .json({ success: true, data: serializeConversation(conversation, req.user) });
});

export const getMessages = asyncHandler(async (req, res) => {
  const conv = await loadMemberConversation(req.params.id, req.user);

  const messages = await Message.find({ conversationId: conv._id })
    .sort({ createdAt: 1 })
    .lean()
    .exec();

  // Opening the thread clears this user's unread counter and marks inbound read.
  const unreadField = req.user.role === 'candidate' ? 'unreadForCandidate' : 'unreadForClient';
  let didRead = false;
  if (conv[unreadField] > 0) {
    conv[unreadField] = 0;
    await conv.save();
    const result = await Message.updateMany(
      { conversationId: conv._id, senderId: { $ne: req.user.id }, readAt: null },
      { $set: { readAt: new Date() } },
    ).exec();
    didRead = (result.modifiedCount || 0) > 0;

    if (conv.applicationId) {
      const appField = req.user.role === 'candidate' ? 'unreadCandidateCount' : 'unreadEmployerCount';
      await Application.findByIdAndUpdate(conv.applicationId, { [appField]: 0 }).exec();
    }
  }

  // Tell the other party their messages were read (blue ticks, in real time).
  if (didRead) {
    const other = otherParty(conv, req.user);
    publishLiveUpdate({
      userId: other.id,
      role: other.role,
      event: 'message-read',
      payload: { conversationId: conv._id.toString(), readerRole: req.user.role },
    });
  }

  const extra = await conversationExtra(conv, req.user);

  res.json({
    success: true,
    data: {
      conversation: serializeConversation(conv, req.user, extra),
      messages: messages.map((m) => serializeMessage(m, req.user.id)),
    },
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const conv = await loadMemberConversation(req.params.id, req.user);

  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';

  let attachment = null;
  let messageType = 'text';
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
    const mime = req.file.mimetype || '';
    messageType = mime.startsWith('image/')
      ? 'image'
      : mime.startsWith('audio/')
        ? 'audio'
        : 'file';
  }

  if (!body && !attachment) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Message text or a file is required');
  }

  const recipient = otherParty(conv, req.user);
  // Mark delivered immediately when the recipient has a live stream open.
  const deliveredAt = isUserOnline(recipient.id) ? new Date() : null;

  const message = await Message.create({
    conversationId: conv._id,
    senderId: req.user.id,
    senderRole: req.user.role,
    messageType,
    body,
    attachment,
    deliveredAt,
  });

  const recipientUnreadField =
    req.user.role === 'candidate' ? 'unreadForClient' : 'unreadForCandidate';
  conv.lastMessage = body || (messageType === 'audio' ? '🎤 Voice note' : `📎 ${attachment.name}`);
  conv.lastMessageAt = message.createdAt;
  conv.lastSenderRole = req.user.role;
  conv[recipientUnreadField] = (conv[recipientUnreadField] || 0) + 1;
  await conv.save();

  if (conv.applicationId) {
    const appUnreadField =
      req.user.role === 'candidate' ? 'unreadEmployerCount' : 'unreadCandidateCount';
    await Application.findByIdAndUpdate(conv.applicationId, {
      latestMessageAt: message.createdAt,
      $inc: { [appUnreadField]: 1 },
    }).exec();
  }

  const serialized = serializeMessage(message, req.user.id);

  // Push the new message to the recipient in real time (from their perspective).
  publishLiveUpdate({
    userId: recipient.id,
    role: recipient.role,
    event: 'message',
    payload: {
      conversationId: conv._id.toString(),
      message: { ...serialized, mine: false },
      lastMessage: conv.lastMessage,
    },
  });

  res.status(StatusCodes.CREATED).json({ success: true, data: serialized });
});

/** Relay a transient typing indicator to the other participant. */
export const sendTyping = asyncHandler(async (req, res) => {
  const conv = await loadMemberConversation(req.params.id, req.user);
  const recipient = otherParty(conv, req.user);

  publishLiveUpdate({
    userId: recipient.id,
    role: recipient.role,
    event: 'typing',
    payload: {
      conversationId: conv._id.toString(),
      fromRole: req.user.role,
      typing: req.body?.typing !== false,
    },
  });

  res.json({ success: true });
});

/**
 * Employer schedules an interview from inside the chat. Posts a structured
 * interview message the candidate sees inline, and moves the application to the
 * "interview" stage so the dashboards stay in sync.
 */
export const scheduleInterview = asyncHandler(async (req, res) => {
  const conv = await loadMemberConversation(req.params.id, req.user);
  if (req.user.role !== 'client') {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only the employer can schedule interviews');
  }

  const { scheduledAt, mode, meetingLink, locationText, notes } = req.body || {};
  const when = new Date(scheduledAt);
  if (!scheduledAt || Number.isNaN(when.getTime())) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'A valid interview date and time is required');
  }

  const meta = {
    scheduledAt: when.toISOString(),
    mode: mode || 'video',
    meetingLink: (meetingLink || '').trim(),
    locationText: (locationText || '').trim(),
    notes: (notes || '').trim(),
  };
  const summary = `📅 Interview scheduled for ${when.toLocaleString('en-IN')}`;

  const candidateId = conv.candidateId.toString();
  const message = await Message.create({
    conversationId: conv._id,
    senderId: req.user.id,
    senderRole: 'client',
    messageType: 'interview',
    body: summary,
    meta,
    deliveredAt: isUserOnline(candidateId) ? new Date() : null,
  });

  conv.lastMessage = summary;
  conv.lastMessageAt = message.createdAt;
  conv.lastSenderRole = 'client';
  conv.unreadForCandidate = (conv.unreadForCandidate || 0) + 1;
  await conv.save();

  if (conv.applicationId) {
    await Application.findByIdAndUpdate(conv.applicationId, {
      $set: {
        status: 'interview',
        statusUpdatedAt: new Date(),
        interviewDetails: {
          scheduledAt: when,
          mode: meta.mode,
          meetingLink: meta.meetingLink,
          locationText: meta.locationText,
          notes: meta.notes,
        },
        latestMessageAt: message.createdAt,
      },
      $push: {
        timeline: {
          status: 'interview',
          note: 'Interview scheduled via chat',
          changedByRole: 'client',
          changedAt: new Date(),
        },
      },
      $inc: { unreadCandidateCount: 1 },
    }).exec();
  }

  const serialized = serializeMessage(message, req.user.id);
  publishLiveUpdate({
    userId: candidateId,
    role: 'candidate',
    event: 'message',
    payload: {
      conversationId: conv._id.toString(),
      message: { ...serialized, mine: false },
      lastMessage: summary,
    },
  });
  publishLiveUpdate({
    userId: candidateId,
    role: 'candidate',
    event: 'application-updated',
    payload: { applicationId: conv.applicationId ? conv.applicationId.toString() : null },
  });

  res.status(StatusCodes.CREATED).json({ success: true, data: serialized });
});

/** Explicitly mark a conversation read (used when a new inbound arrives live). */
export const markConversationRead = asyncHandler(async (req, res) => {
  const conv = await loadMemberConversation(req.params.id, req.user);

  const unreadField = req.user.role === 'candidate' ? 'unreadForCandidate' : 'unreadForClient';
  if (conv[unreadField] > 0) {
    conv[unreadField] = 0;
    await conv.save();
  }

  const result = await Message.updateMany(
    { conversationId: conv._id, senderId: { $ne: req.user.id }, readAt: null },
    { $set: { readAt: new Date() } },
  ).exec();

  if (conv.applicationId) {
    const appField = req.user.role === 'candidate' ? 'unreadCandidateCount' : 'unreadEmployerCount';
    await Application.findByIdAndUpdate(conv.applicationId, { [appField]: 0 }).exec();
  }

  if ((result.modifiedCount || 0) > 0) {
    const other = otherParty(conv, req.user);
    publishLiveUpdate({
      userId: other.id,
      role: other.role,
      event: 'message-read',
      payload: { conversationId: conv._id.toString(), readerRole: req.user.role },
    });
  }

  res.json({ success: true });
});
