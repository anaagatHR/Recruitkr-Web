import mongoose from 'mongoose';

/**
 * A message in the 1:1 chat between an intern and their Department Head.
 *
 * Kept separate from the candidate↔employer Conversation/Message models so the
 * existing job-application chat is untouched. There is exactly one logical
 * thread per intern (with their head), so we key messages by internId rather
 * than a separate Conversation document.
 */
const internMessageSchema = new mongoose.Schema(
  {
    // The intern whose thread this message belongs to.
    internId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // 'intern' = the intern, 'head' = the Department Head (admin/client).
    senderRole: { type: String, enum: ['intern', 'head'], required: true },
    body: { type: String, trim: true, default: '' },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

internMessageSchema.index({ internId: 1, createdAt: 1 });

export const InternMessage = mongoose.model('InternMessage', internMessageSchema);
