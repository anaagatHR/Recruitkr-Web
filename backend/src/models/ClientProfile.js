import mongoose from 'mongoose';

const clientProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    companyName: { type: String, trim: true },
    industry: { type: String, trim: true },
    companyWebsite: { type: String, trim: true },
    companySize: { type: String },
    companyType: { type: String },
    spoc: {
      name: { type: String, trim: true },
      designation: { type: String, trim: true },
      mobile: { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
    },
    commercial: {
      recruitmentModel: { type: String },
      replacementPeriod: { type: String },
      paymentTerms: { type: String },
    },
    billing: {
      billingCompanyName: { type: String, trim: true },
      gstNumber: { type: String, trim: true, uppercase: true },
      billingAddress: { type: String, trim: true },
      billingEmail: { type: String, lowercase: true, trim: true },
    },
    profileImage: {
      name: { type: String, trim: true, default: '' },
      url: { type: String, trim: true, default: '' },
      fileId: { type: String, trim: true, default: '' },
      size: { type: Number, default: 0 },
      type: { type: String, trim: true, default: '' },
    },
    city: { type: String, trim: true, default: '' },
    company: { type: String, trim: true, default: '' },
    contactName: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    location: { type: String, trim: true, default: '' },
    mobile: { type: String, trim: true, default: '' },
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    requirements: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    declarationAccepted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

clientProfileSchema.index({ companyName: 1 });

export const ClientProfile = mongoose.model('ClientProfile', clientProfileSchema);

