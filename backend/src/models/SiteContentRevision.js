import mongoose from 'mongoose';

/** Append-only: one row per publish (and per rollback), so any version can come back. */
const siteContentRevisionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    version: { type: Number, required: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
    publishedBy: { type: String, default: '' },
    note: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'sitecontentrevisions', versionKey: false, minimize: false },
);

siteContentRevisionSchema.index({ key: 1, version: -1 });

export default mongoose.models.SiteContentRevision || mongoose.model('SiteContentRevision', siteContentRevisionSchema);
