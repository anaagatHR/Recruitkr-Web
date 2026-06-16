import mongoose from 'mongoose';

/**
 * A 1:1 LinkedIn-style conversation between a candidate and a client (employer).
 * Usually opened off the back of an Application, but the link is optional so a
 * conversation can outlive the application it started from.
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

    lastMessage: { type: String, trim: true, default: '' },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastSenderRole: { type: String, enum: ['candidate', 'client'], default: 'client' },

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
