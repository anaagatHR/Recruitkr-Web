import mongoose from 'mongoose';

const candidateProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
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

export const CandidateProfile = mongoose.model('CandidateProfile', candidateProfileSchema);

