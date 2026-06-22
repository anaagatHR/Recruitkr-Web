import mongoose from 'mongoose';

/**
 * Denormalised snapshot of the candidate, captured at apply time, so the chat
 * sidebar/header can show their full profile without extra joins.
 */
const candidateSnapshotSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    photoUrl: { type: String, trim: true, default: '' },
    qualification: { type: String, trim: true, default: '' },
    skills: { type: [String], default: [] },
    experience: { type: String, trim: true, default: '' },
    preferredLocation: { type: String, trim: true, default: '' },
    portfolioUrl: { type: String, trim: true, default: '' },
    linkedinUrl: { type: String, trim: true, default: '' },
    resumeUrl: { type: String, trim: true, default: '' },
    resumeType: { type: String, trim: true, default: '' },
    // Candidate-uploaded intro videos, surfaced to the employer in the chat.
    videos: {
      type: [
        new mongoose.Schema(
          {
            url: { type: String, trim: true, default: '' },
            name: { type: String, trim: true, default: 'Video' },
            type: { type: String, trim: true, default: '' },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    appliedFor: { type: String, trim: true, default: '' },
    appliedAt: { type: Date },
  },
  { _id: false },
);

/**
 * A 1:1 WhatsApp-style conversation between a candidate and a client (employer).
 * `clientId` is the employer. Conversations are created automatically when a
 * candidate applies (see conversation.service.js); the applicationId link is
 * what guarantees one thread per application.
 */
const conversationSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRequirement' },

    // Denormalised display context so the conversation list renders without joins.
    jobTitle: { type: String, trim: true, default: '' },
    companyName: { type: String, trim: true, default: '' },
    candidateName: { type: String, trim: true, default: '' },
    candidateSnapshot: { type: candidateSnapshotSchema, default: () => ({}) },

    lastMessage: { type: String, trim: true, default: '' },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastSenderRole: { type: String, enum: ['candidate', 'client', 'system'], default: 'system' },

    // Set true once the system "applied" message has been seeded, so re-running
    // ensureConversationForApplication never posts a duplicate first message.
    systemSeeded: { type: Boolean, default: false },

    // Per-participant unread counters, reset when that participant opens the thread.
    unreadForCandidate: { type: Number, default: 0 },
    unreadForClient: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// One conversation per candidate/client pair per application (application may be absent).
conversationSchema.index(
  { candidateId: 1, clientId: 1, applicationId: 1 },
  { unique: true },
);

export const Conversation = mongoose.model('Conversation', conversationSchema);
