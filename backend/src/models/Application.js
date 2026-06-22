import mongoose from 'mongoose';

const interviewDetailsSchema = new mongoose.Schema(
  {
    scheduledAt: { type: Date },
    timezone: { type: String, trim: true },
    mode: {
      type: String,
      enum: ['onsite', 'google-meet', 'phone', 'video', 'zoom', 'other'],
    },
    locationText: { type: String, trim: true },
    googleMapsUrl: { type: String, trim: true },
    meetingLink: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },
    notes: { type: String, trim: true },
    reportingNotes: { type: String, trim: true },
    documentsRequired: { type: String, trim: true },
    additionalInstructions: { type: String, trim: true },
  },
  { _id: false },
);

const applicationTimelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['applied', 'under-review', 'screening', 'interview', 'offer', 'hired', 'rejected'],
      required: true,
    },
    note: { type: String, trim: true },
    changedByRole: {
      type: String,
      enum: ['candidate', 'client', 'system'],
      default: 'system',
    },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const applicationSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRequirement', index: true },
    sourceCollection: { type: String, trim: true, enum: ['jobs', 'openings', 'jobRequirements'] },
    sourceJobId: { type: String, trim: true },
    sourceJobSnapshot: {
      jobTitle: { type: String, trim: true },
      jobLocation: { type: String, trim: true },
      employmentType: { type: String, trim: true },
      companyName: { type: String, trim: true },
    },
    fullName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    qualification: { type: String, trim: true },
    college: { type: String, trim: true, default: '' },
    currentCity: { type: String, trim: true },

    // Rich candidate snapshot, captured at apply time and shared with the
    // employer on the applications page and chat header.
    profilePhotoUrl: { type: String, trim: true, default: '' },
    skills: { type: [String], default: [] },
    experienceLabel: { type: String, trim: true, default: '' },
    preferredLocation: { type: String, trim: true, default: '' },
    portfolioUrl: { type: String, trim: true, default: '' },
    linkedinUrl: { type: String, trim: true, default: '' },
    experience: {
      type: [
        new mongoose.Schema(
          {
            jobProfile: { type: String, trim: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    resumePath: { type: String, trim: true },
    resumeData: { type: Buffer, select: false },
    hasCustomResume: { type: Boolean, default: false },
    submittedAt: { type: Date },
    notes: { type: String, trim: true, default: '' },
    appliedFor: { type: String, trim: true },
    status: {
      type: String,
      enum: ['applied', 'under-review', 'screening', 'interview', 'offer', 'hired', 'rejected'],
      default: 'applied',
      index: true,
    },
    statusNote: { type: String, trim: true },
    statusUpdatedAt: { type: Date, default: Date.now },
    interviewDetails: interviewDetailsSchema,
    timeline: { type: [applicationTimelineSchema], default: [] },

    // Auto-created conversation + its rollups, so the applications list can show
    // chat activity without joining the Conversation collection.
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', index: true },
    latestMessageAt: { type: Date },
    unreadCandidateCount: { type: Number, default: 0 },
    unreadEmployerCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

applicationSchema.index(
  { candidateId: 1, jobId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      jobId: { $exists: true, $type: 'objectId' },
    },
  },
);
applicationSchema.index(
  { candidateId: 1, sourceCollection: 1, sourceJobId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sourceCollection: { $exists: true, $type: 'string' },
      sourceJobId: { $exists: true, $type: 'string' },
    },
  },
);

export const Application = mongoose.model('Application', applicationSchema);

