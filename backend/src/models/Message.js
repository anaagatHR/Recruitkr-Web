import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, required: true },
    fileId: { type: String, trim: true, default: '' },
    name: { type: String, trim: true, default: 'attachment' },
    type: { type: String, trim: true, default: '' },
    size: { type: Number, default: 0 },
  },
  { _id: false },
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['candidate', 'client', 'system'], required: true },
    // 'system' = auto-generated (e.g. "X applied for Y"); others describe payload.
    messageType: {
      type: String,
      enum: ['text', 'system', 'image', 'file', 'attachment', 'interview'],
      default: 'text',
    },
    body: { type: String, trim: true, default: '' },
    attachment: { type: attachmentSchema, default: null },
    // Structured payload for special messages (e.g. interview scheduling).
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.model('Message', messageSchema);
