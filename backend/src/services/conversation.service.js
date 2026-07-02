import { Application } from '../models/Application.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { publishLiveUpdate, indexConversationPartners } from './liveUpdate.service.js';

/**
 * Build the denormalised candidate snapshot stored on the conversation and
 * application, so the employer sees the full profile in the chat + list.
 */
export const buildCandidateSnapshot = ({ candidateUser, candidateProfile, resume, appliedFor, appliedAt }) => {
  const experienceLabel =
    candidateProfile?.experienceStatus === 'experienced'
      ? [candidateProfile?.experienceDetails?.designation, candidateProfile?.experienceDetails?.totalExperience]
          .filter(Boolean)
          .join(' · ') || 'Experienced'
      : 'Fresher';

  return {
    fullName: candidateProfile?.fullName || '',
    email: candidateUser?.email || candidateProfile?.email || '',
    phone: candidateUser?.mobile || candidateProfile?.phone || '',
    photoUrl: candidateProfile?.profilePhotoUrl || '',
    qualification: candidateProfile?.highestQualification || '',
    skills: Array.isArray(candidateProfile?.skills) ? candidateProfile.skills : [],
    experience: experienceLabel,
    preferredLocation:
      candidateProfile?.preferences?.preferredLocation || candidateProfile?.preferredLocation || '',
    portfolioUrl: candidateProfile?.portfolioUrl || '',
    linkedinUrl: candidateProfile?.linkedinUrl || '',
    resumeUrl: resume?.resumeType === 'uploaded' ? resume?.resumeUrl || '' : '',
    resumeType: resume?.resumeType || '',
    videos: Array.isArray(candidateProfile?.videos)
      ? candidateProfile.videos.map((video) => ({
          url: video.url,
          name: video.name || 'Video',
          type: video.type || '',
        }))
      : [],
    appliedFor: appliedFor || '',
    appliedAt: appliedAt || new Date(),
  };
};

/**
 * Idempotently create the conversation tied to an application and seed the
 * system "applied" message exactly once. Safe to call repeatedly — the unique
 * (candidate, client, application) index and `systemSeeded` flag guarantee a
 * single thread and a single first message. Returns the conversation.
 */
export const ensureConversationForApplication = async ({ application, snapshot, jobTitle, companyName }) => {
  const candidateId = String(application.candidateId);
  const clientId = String(application.clientId);
  const applicationId = String(application._id);

  let conversation = await Conversation.findOne({ candidateId, clientId, applicationId }).exec();

  if (!conversation) {
    try {
      conversation = await Conversation.create({
        candidateId,
        clientId,
        applicationId,
        jobId: application.jobId,
        jobTitle: jobTitle || application.appliedFor || '',
        companyName: companyName || application.sourceJobSnapshot?.companyName || '',
        candidateName: snapshot?.fullName || application.fullName || '',
        candidateSnapshot: snapshot || {},
        lastSenderRole: 'system',
      });
    } catch (error) {
      // A concurrent apply may have created it first — re-read and continue.
      if (error?.code === 11000) {
        conversation = await Conversation.findOne({ candidateId, clientId, applicationId }).exec();
      } else {
        throw error;
      }
    }
  }

  if (!conversation) return null;

  // Keep the in-memory presence adjacency current in O(1) for online partners.
  indexConversationPartners(candidateId, clientId);

  if (!conversation.systemSeeded) {
    const candidateName = snapshot?.fullName || conversation.candidateName || 'A candidate';
    const position = conversation.jobTitle || 'this position';
    const text = `${candidateName} has applied for ${position}.`;

    const systemMessage = await Message.create({
      conversationId: conversation._id,
      senderId: application.candidateId,
      senderRole: 'system',
      messageType: 'system',
      body: text,
      deliveredAt: new Date(),
    });

    conversation.systemSeeded = true;
    if (snapshot) conversation.candidateSnapshot = snapshot;
    conversation.lastMessage = text;
    conversation.lastMessageAt = systemMessage.createdAt;
    conversation.lastSenderRole = 'system';
    conversation.unreadForClient = (conversation.unreadForClient || 0) + 1;
    await conversation.save();

    await Application.findByIdAndUpdate(application._id, {
      conversationId: conversation._id,
      latestMessageAt: systemMessage.createdAt,
      $inc: { unreadEmployerCount: 1 },
    }).exec();

    const payload = {
      conversationId: String(conversation._id),
      applicationId,
      jobId: application.jobId ? String(application.jobId) : null,
      jobTitle: conversation.jobTitle,
      lastMessage: text,
    };

    // Show the new thread instantly in both inboxes, and notify the employer.
    publishLiveUpdate({ userId: clientId, role: 'client', event: 'conversation-created', payload });
    publishLiveUpdate({ userId: clientId, role: 'client', event: 'message', payload: { ...payload, system: true } });
    publishLiveUpdate({ userId: candidateId, role: 'candidate', event: 'conversation-created', payload });
  } else if (!application.conversationId) {
    await Application.findByIdAndUpdate(application._id, { conversationId: conversation._id }).exec();
  }

  return conversation;
};

/**
 * Notify a user's conversation partners that they came online / went offline,
 * so the chat header presence dot updates in real time.
 */
export const broadcastPresence = async ({ userId, online }) => {
  const id = String(userId);
  const conversations = await Conversation.find({ $or: [{ candidateId: id }, { clientId: id }] })
    .select('candidateId clientId')
    .lean()
    .exec();

  const partners = new Map(); // partnerId -> partnerRole
  for (const conv of conversations) {
    const candidateId = conv.candidateId.toString();
    const clientId = conv.clientId.toString();
    if (candidateId === id) partners.set(clientId, 'client');
    else if (clientId === id) partners.set(candidateId, 'candidate');
  }

  for (const [partnerId, role] of partners.entries()) {
    publishLiveUpdate({ userId: partnerId, role, event: 'presence', payload: { userId: id, online } });
  }
};
