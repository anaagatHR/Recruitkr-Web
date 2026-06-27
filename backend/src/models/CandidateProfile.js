import mongoose from 'mongoose';

import { buildRecruitkrId } from '../utils/recruitkrId.js';

const candidateProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    // Human-readable unique candidate id, e.g. RKR-2026-8KJ3. Assigned on first
    // save by the pre-save hook below. `sparse` keeps the unique index happy for
    // any legacy docs that predate this field until they are backfilled.
    recruitkrId: { type: String, unique: true, sparse: true, trim: true },
    fullName: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String },
    address: { type: String, trim: true },
    pincode: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    portfolioUrl: { type: String, trim: true },
    highestQualification: { type: String },
    experienceStatus: { type: String, enum: ['fresher', 'experienced'] },
    experienceDetails: {
      currentCompany: String,
      designation: String,
      totalExperience: String,
      industry: String,
      currentCtcLpa: Number,
      expectedCtcLpa: Number,
      minimumCtcLpa: Number,
      noticePeriod: String,
      lastWorkingDay: Date,
    },
    preferences: {
      preferredLocation: { type: String },
      preferredIndustry: { type: String },
      preferredRole: { type: String },
      workModes: { type: [String], default: [] },
    },
    summary: { type: String, trim: true, default: '' },
    skills: { type: [String], default: [] },
    projects: {
      type: [
        {
          name: { type: String, trim: true, default: '' },
          description: { type: String, trim: true, default: '' },
        },
      ],
      default: [],
    },
    certifications: {
      type: [
        {
          name: { type: String, trim: true, default: '' },
          institute: { type: String, trim: true, default: '' },
        },
      ],
      default: [],
    },
    referral: { type: String, trim: true, default: '' },
    profilePhotoUrl: { type: String, trim: true, default: '' },
    profilePhotoFileId: { type: String, trim: true, default: '' },
    // Candidate-uploaded intro/portfolio videos, shown to employers in the chat.
    videos: {
      type: [
        new mongoose.Schema(
          {
            url: { type: String, trim: true, required: true },
            fileId: { type: String, trim: true, default: '' },
            name: { type: String, trim: true, default: 'video' },
            type: { type: String, trim: true, default: '' },
            size: { type: Number, default: 0 },
            uploadedAt: { type: Date, default: Date.now },
          },
          { _id: true },
        ),
      ],
      default: [],
    },
    about: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    currentCity: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    isActive: { type: Boolean, default: true },
    mobile: { type: String, trim: true, default: '' },
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    preferredIndustry: { type: String, trim: true, default: '' },
    preferredLocation: { type: String, trim: true, default: '' },
    preferredRole: { type: String, trim: true, default: '' },
    resumePath: { type: String, trim: true, default: '' },
    workModes: { type: [String], default: [] },
    declarationAccepted: { type: Boolean, default: false },
    representationAuthorized: { type: Boolean, default: false },
  },
  { timestamps: true },
);

candidateProfileSchema.index({ fullName: 1 });

// Assign a unique RecruitKr id the first time a profile is saved (covers new
// registrations, Google sign-ups, and lazy backfill of older profiles). Retries
// on the rare random collision before giving up.
candidateProfileSchema.pre('save', async function assignRecruitkrId(next) {
  if (this.recruitkrId) return next();
  try {
    const year = (this.createdAt ? new Date(this.createdAt) : new Date()).getFullYear();
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const candidateId = buildRecruitkrId(year);
      // eslint-disable-next-line no-await-in-loop
      const clash = await this.constructor.exists({ recruitkrId: candidateId });
      if (!clash) {
        this.recruitkrId = candidateId;
        return next();
      }
    }
    return next(new Error('Unable to allocate a unique RecruitKr id'));
  } catch (error) {
    return next(error);
  }
});

export const CandidateProfile = mongoose.model('CandidateProfile', candidateProfileSchema);

