import mongoose from 'mongoose';

/**
 * One editable part of the public site (Site Studio). `draft` is what the
 * editor is working on, `published` is what visitors see; both are validated
 * against backend/src/shared/siteContentSchema.js before they are stored.
 */
const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    draft: { type: mongoose.Schema.Types.Mixed, default: null },
    published: { type: mongoose.Schema.Types.Mixed, default: null },
    version: { type: Number, default: 0 },
    updatedBy: { type: String, default: '' },
    updatedAt: { type: Date, default: null },
    publishedBy: { type: String, default: '' },
    publishedAt: { type: Date, default: null },
  },
  { collection: 'sitecontents', versionKey: false, minimize: false },
);

export default mongoose.models.SiteContent || mongoose.model('SiteContent', siteContentSchema);
