import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    mobile: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    // Optional context from the form that sent it (Business OS "Client Queries").
    source: { type: String, enum: ['contact', 'partners'], default: 'contact', index: true },
    company: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['unread', 'read'],
      default: 'unread',
      index: true,
    },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
