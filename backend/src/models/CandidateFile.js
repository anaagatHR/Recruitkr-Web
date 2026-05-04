import mongoose from 'mongoose';

const candidateFileSchema = new mongoose.Schema(
  {
    candidateUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    kind: { type: String, enum: ['certificate'], required: true, index: true },
    title: { type: String, trim: true, default: '' },
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    fileId: { type: String, required: true, trim: true },
    size: { type: Number, required: true },
    type: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export const CandidateFile = mongoose.model('CandidateFile', candidateFileSchema);
