import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';

import { env } from '../config/env.js';
import { BlogImageAsset } from '../models/BlogImageAsset.js';
import { BlogPost } from '../models/BlogPost.js';
import { uploadBufferToImageKit } from '../services/imagekit.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const BLOG_IMAGE_FOLDER = '/recruitkr_blog';
const imageKitEndpointUrl = new URL(env.IMAGEKIT_URL_ENDPOINT);
const imageKitHost = imageKitEndpointUrl.host;
const imageKitBasePath = imageKitEndpointUrl.pathname.replace(/\/$/, '');
const blogImagePathPrefix = `${imageKitBasePath}${BLOG_IMAGE_FOLDER}/`.replace(/\/{2,}/g, '/');

const toSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const ensureUniqueSlug = async (baseSlug, excludeId) => {
  const rootSlug = toSlug(baseSlug);
  let candidate = rootSlug;
  let counter = 1;

  while (true) {
    const existing = await BlogPost.findOne({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).select('_id');

    if (!existing) return candidate;
    counter += 1;
    candidate = `${rootSlug}-${counter}`;
  }
};

const containsBase64Image = (value = '') => /<img[^>]+src=["']data:image\/[^"']+["'][^>]*>/i.test(value);
const imageTagPattern = /<img[^>]+src=(["'])([^"']+)\1[^>]*>/gi;

const cleanHtml = (value = '') =>
  value
    .replace(/&nbsp;|\u00A0/g, ' ')
    .replace(/\sstyle="[^"]*"/gi, '')
    .replace(/\sclass="[^"]*"/gi, '')
    .replace(/\sid="[^"]*"/gi, '')
    .replace(/<span>(.*?)<\/span>/gi, '$1')
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

const htmlToParagraphs = (value = '') => {
  const normalized = value
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li)>/gi, '$&\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00A0/g, ' ')
    .split('\n')
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : [''];
};

const paragraphsToHtml = (paragraphs = []) =>
  paragraphs
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join('');

const normalizeImageAsset = (asset) => {
  if (!asset || typeof asset !== 'object') return null;

  const url = String(asset.url || '').trim();
  const fileId = String(asset.fileId || '').trim();
  const name = String(asset.name || '').trim();
  const type = String(asset.type || '').trim();
  const size = Number(asset.size);

  if (!url || !fileId || !name || !type || !Number.isFinite(size) || size <= 0) {
    return null;
  }

  return {
    url,
    fileId,
    name,
    size,
    type,
  };
};

const isTrackedBlogImageUrl = (value = '') => {
  try {
    const parsed = new URL(String(value || '').trim());
    return parsed.host === imageKitHost && parsed.pathname.startsWith(blogImagePathPrefix);
  } catch {
    return false;
  }
};

const extractImageUrlsFromHtml = (html = '') => {
  const urls = [];
  for (const match of String(html || '').matchAll(imageTagPattern)) {
    const src = String(match[2] || '').trim();
    if (src) urls.push(src);
  }
  return urls;
};

const validateTrackedBlogImages = ({ contentHtml = '', contentImages = [], coverImage = null }) => {
  const imageUrlsInHtml = extractImageUrlsFromHtml(contentHtml);
  const invalidHtmlImageUrl = imageUrlsInHtml.find((url) => !isTrackedBlogImageUrl(url));
  if (invalidHtmlImageUrl) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'All blog content images must be uploaded through the blog uploader before saving.',
    );
  }

  const normalizedContentImages = contentImages
    .map(normalizeImageAsset)
    .filter(Boolean);
  const contentImageMap = new Map(normalizedContentImages.map((asset) => [asset.url, asset]));

  const missingImageMetadata = imageUrlsInHtml.find((url) => !contentImageMap.has(url));
  if (missingImageMetadata) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Every image used in blog content must have matching metadata in contentImages.',
    );
  }

  const normalizedCoverImage = normalizeImageAsset(coverImage);
  if (coverImage !== null && coverImage !== undefined && !normalizedCoverImage) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Cover image metadata is incomplete.');
  }
  if (normalizedCoverImage && !isTrackedBlogImageUrl(normalizedCoverImage.url)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Cover image must be uploaded through the blog uploader before saving.',
    );
  }

  const usedContentImages = imageUrlsInHtml.map((url) => contentImageMap.get(url));
  const uniqueContentImages = Array.from(
    new Map(usedContentImages.filter(Boolean).map((asset) => [asset.url, asset])).values(),
  );

  return {
    coverImage: normalizedCoverImage,
    contentImages: uniqueContentImages,
  };
};

const normalizePayload = async (payload, existingPost) => {
  const incomingHtml = payload.contentHtml?.trim();
  if (incomingHtml && containsBase64Image(incomingHtml)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Base64 images are not allowed. Please upload images and use their URL.');
  }
  if (typeof payload.coverImage === 'string' && payload.coverImage.trim().startsWith('data:image/')) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Base64 cover images are not allowed. Please upload the image first.');
  }

  const contentHtml = incomingHtml
    ? cleanHtml(incomingHtml)
    : existingPost?.contentHtml || '';

  const content = contentHtml
    ? htmlToParagraphs(contentHtml)
    : payload.content
      ? payload.content.map((paragraph) => paragraph.trim()).filter(Boolean)
      : existingPost?.content;

  const tags = payload.tags
    ? payload.tags.map((tag) => tag.trim()).filter(Boolean)
    : existingPost?.tags;

  const title = payload.title?.trim() ?? existingPost?.title;
  const requestedSlug = payload.slug?.trim() || payload.title || existingPost?.slug || title;

  const slug = await ensureUniqueSlug(requestedSlug, existingPost?._id);
  const status = payload.status ?? existingPost?.status ?? 'draft';

  let publishedAt =
    payload.publishedAt === null
      ? null
      : payload.publishedAt ?? existingPost?.publishedAt ?? null;

  if (status === 'published' && !publishedAt) {
    publishedAt = new Date();
  }

  if (status === 'draft') {
    publishedAt = null;
  }

  const trackedImages = validateTrackedBlogImages({
    contentHtml: contentHtml || paragraphsToHtml(content || []),
    contentImages: payload.contentImages ?? existingPost?.contentImages ?? [],
    coverImage:
      payload.coverImage === null
        ? null
        : payload.coverImage ?? existingPost?.coverImage ?? null,
  });

  return {
    title,
    slug,
    excerpt: payload.excerpt?.trim() ?? existingPost?.excerpt,
    authorName: payload.authorName?.trim() ?? existingPost?.authorName ?? 'RecruitKr Editorial',
    coverImage: trackedImages.coverImage,
    contentHtml: contentHtml || paragraphsToHtml(content || []),
    content,
    contentImages: trackedImages.contentImages,
    tags,
    readingTime: payload.readingTime?.trim() ?? existingPost?.readingTime,
    status,
    publishedAt,
  };
};

const serializeBlogPost = (post) => {
  const raw = typeof post?.toObject === 'function' ? post.toObject() : post;
  const content = Array.isArray(raw?.content) ? raw.content.filter(Boolean) : [];
  const tags = Array.isArray(raw?.tags) ? raw.tags.filter(Boolean) : [];

  return {
    _id: raw?._id,
    slug: raw?.slug || '',
    title: raw?.title || 'Untitled blog post',
    excerpt: raw?.excerpt || content[0]?.slice(0, 220) || 'No description available.',
    authorName: raw?.authorName || 'RecruitKr Editorial',
    coverImage: normalizeImageAsset(raw?.coverImage),
    contentHtml: raw?.contentHtml || paragraphsToHtml(content),
    contentImages: Array.isArray(raw?.contentImages) ? raw.contentImages.map(normalizeImageAsset).filter(Boolean) : [],
    publishedAt: raw?.publishedAt || null,
    readingTime: raw?.readingTime || '5 min read',
    tags,
    content,
    status: raw?.status ?? null,
    createdAt: raw?.createdAt || null,
    updatedAt: raw?.updatedAt || null,
  };
};

const buildPublishedBlogQuery = () => ({
  $or: [
    { isPublished: true },
    { status: 'Published' },
    { status: 'published' },
    { status: { $exists: false } },
    { status: null },
  ],
});

export const listPublishedBlogPosts = asyncHandler(async (req, res) => {
  const publishedOnly = `${req.query?.published ?? ''}` === 'true';
  const query = publishedOnly ? buildPublishedBlogQuery() : {};
  console.log('ROUTE HIT');
  const posts = await BlogPost.find(query).sort({ publishedAt: -1, createdAt: -1 });
  const normalizedPosts = posts.map(serializeBlogPost);
  console.log('BLOG COUNT:', normalizedPosts.length);
  console.info('[blog:listPublished]', {
    publishedOnly,
    count: normalizedPosts.length,
    slugs: normalizedPosts.map((post) => post.slug),
  });
  res.json({ success: true, blogPosts: normalizedPosts, meta: { count: normalizedPosts.length } });
});

export const getPublishedBlogPostBySlug = asyncHandler(async (req, res) => {
  const publicBlogQuery = buildPublishedBlogQuery();
  const post = await BlogPost.findOne({
    slug: req.params.slug,
    ...publicBlogQuery,
  });
  if (!post) {
    console.warn('[blog:getPublishedBySlug:notFound]', { slug: req.params.slug });
    throw new ApiError(StatusCodes.NOT_FOUND, 'Blog post not found');
  }
  const normalizedPost = serializeBlogPost(post);
  console.info('[blog:getPublishedBySlug]', {
    slug: normalizedPost.slug,
    title: normalizedPost.title,
  });
  res.json({ success: true, data: normalizedPost });
});

export const uploadBlogImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Blog image file is required');
  }

  const uploadedAsset = await uploadBufferToImageKit({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    folder: BLOG_IMAGE_FOLDER,
  });

  const asset = await BlogImageAsset.create({
    name: uploadedAsset.name,
    url: uploadedAsset.url,
    fileId: uploadedAsset.fileId,
    type: req.file.mimetype,
    size: req.file.size,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: {
      url: uploadedAsset.url,
      name: asset.name,
      size: asset.size,
      type: asset.type,
      imageId: asset.id,
      fileId: asset.fileId,
    },
  });
});

export const getBlogImage = asyncHandler(async (req, res) => {
  const asset = await BlogImageAsset.findById(req.params.imageId).select('url');
  if (!asset?.url) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Blog image not found');
  }

  return res.redirect(asset.url);
});

export const listAdminBlogPosts = asyncHandler(async (_req, res) => {
  const posts = await BlogPost.find().sort({ updatedAt: -1, createdAt: -1 });
  res.json({ success: true, blogPosts: posts.map(serializeBlogPost), meta: { count: posts.length } });
});

export const createBlogPost = asyncHandler(async (req, res) => {
  const normalized = await normalizePayload(req.body);
  const post = await BlogPost.create({
    ...normalized,
    authorId: req.user.id,
  });

  console.info('[blog:create]', {
    id: post.id,
    slug: post.slug,
    status: post.status,
  });
  res.status(StatusCodes.CREATED).json({ success: true, data: serializeBlogPost(post) });
});

export const updateBlogPost = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  if (!mongoose.isValidObjectId(blogId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid blog id');
  }

  const existing = await BlogPost.findById(blogId);
  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Blog post not found');
  }

  const normalized = await normalizePayload(req.body, existing);
  Object.assign(existing, normalized);
  await existing.save();

  console.info('[blog:update]', {
    id: existing.id,
    slug: existing.slug,
    status: existing.status,
  });
  res.json({ success: true, data: serializeBlogPost(existing) });
});

export const deleteBlogPost = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  if (!mongoose.isValidObjectId(blogId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid blog id');
  }

  const deleted = await BlogPost.findByIdAndDelete(blogId);
  if (!deleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Blog post not found');
  }

  res.json({ success: true, message: 'Blog post deleted' });
});
