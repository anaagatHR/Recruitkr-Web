import mongoose from 'mongoose';

/**
 * A task assigned to an intern by their Department Head (from the admin panel).
 * The intern sees it on the website portal and uploads their completed work
 * against it. Uploaded files are stored on ImageKit (url + fileId) so the head
 * can review them from the admin panel.
 */
const submissionSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, required: true },
    fileId: { type: String, trim: true, default: '' },
    name: { type: String, trim: true, default: 'submission' },
    type: { type: String, trim: true, default: '' },
    size: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const internTaskSchema = new mongoose.Schema(
  {
    // The intern this task belongs to (User with role 'intern').
    internId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // The Department Head who assigned it.
    assignedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    assignedByName: { type: String, trim: true, default: '' },

    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: '' },
    dueDate: { type: Date },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },

    // Lifecycle: the head assigns → intern submits work → head marks reviewed.
    status: {
      type: String,
      enum: ['assigned', 'in-progress', 'submitted', 'reviewed', 'completed'],
      default: 'assigned',
      index: true,
    },

    // Files the intern uploaded as their completed work (newest last).
    submissions: { type: [submissionSchema], default: [] },
    // Free-text note the intern adds with a submission.
    submissionNote: { type: String, trim: true, default: '' },
    submittedAt: { type: Date },

    // Feedback the head leaves after review.
    reviewNote: { type: String, trim: true, default: '' },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

internTaskSchema.index({ internId: 1, createdAt: -1 });

export const InternTask = mongoose.model('InternTask', internTaskSchema);
