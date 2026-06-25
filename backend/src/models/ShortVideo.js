import mongoose from 'mongoose';

/**
 * A short video shown in the marketing-page carousels.
 *
 * - source 'youtube': `videoId` is the part after youtube.com/shorts/.
 * - source 'upload':  the file is stored on ImageKit; `url` plays inline and
 *   `fileId` is kept so the asset can be deleted with the row.
 *
 * `audience` controls where it appears (candidate / employer / both).
 */
const shortVideoSchema = new mongoose.Schema(
  {
    source: { type: String, enum: ['youtube', 'upload'], default: 'youtube' },
    videoId: { type: String, trim: true },
    url: { type: String, trim: true, default: '' }, // ImageKit URL when source='upload'
    fileId: { type: String, trim: true, default: '' }, // ImageKit fileId, for deletion
    posterUrl: { type: String, trim: true, default: '' }, // optional thumbnail
    title: { type: String, trim: true, default: '' },
    audience: {
      type: String,
      enum: ['candidate', 'employer', 'both'],
      default: 'both',
      index: true,
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

// Unique per audience, but only for YouTube rows that actually have a videoId —
// uploads (no videoId) must not collide. NOTE: a pre-existing non-partial index
// named `audience_1_videoId_1` may exist in older DBs; drop it once so this
// partial index can take over: db.shortvideos.dropIndex('audience_1_videoId_1').
shortVideoSchema.index(
  { audience: 1, videoId: 1 },
  {
    unique: true,
    name: 'audience_videoId_unique',
    partialFilterExpression: { videoId: { $type: 'string' } },
  },
);

export const ShortVideo = mongoose.model('ShortVideo', shortVideoSchema);
