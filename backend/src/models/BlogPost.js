import mongoose from 'mongoose';

const imageAssetSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    fileId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 320,
    },
    authorName: {
      type: String,
      trim: true,
      default: 'RecruitKr Editorial',
      maxlength: 120,
    },
    coverImage: {
      type: imageAssetSchema,
      default: null,
    },
    contentHtml: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'At least one content paragraph is required',
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    contentImages: {
      type: [imageAssetSchema],
      default: [],
    },
    readingTime: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

export const BlogPost = mongoose.model('BlogPost', blogPostSchema);
