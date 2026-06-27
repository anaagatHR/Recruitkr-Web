/**
 * One-off repair: give every blog post a valid, unique slug.
 *
 * Some posts were inserted directly into MongoDB (bypassing Mongoose), leaving
 * `slug: ""`. The public list renders them, but the detail page looks a post up
 * by slug, so an empty slug makes "Read More" return "Blog post not found".
 *
 * This also normalizes a capitalized `status: "Published"` to the lowercase
 * enum value the schema expects.
 *
 *   node backend/scripts/backfillBlogSlugs.js
 */
import mongoose from 'mongoose';

import { connectDb } from '../src/config/db.js';

const toSlug = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const run = async () => {
  await connectDb();
  const collection = mongoose.connection.collection('blogposts');

  const posts = await collection.find({}).toArray();
  const usedSlugs = new Set(
    posts.map((p) => (typeof p.slug === 'string' ? p.slug.trim() : '')).filter(Boolean),
  );

  let fixedSlugs = 0;
  let fixedStatus = 0;

  for (const post of posts) {
    const update = {};

    const currentSlug = typeof post.slug === 'string' ? post.slug.trim() : '';
    if (!currentSlug) {
      const base = toSlug(post.title || '') || `blog-post-${String(post._id).slice(-6)}`;
      let candidate = base;
      let counter = 1;
      while (usedSlugs.has(candidate)) {
        counter += 1;
        candidate = `${base}-${counter}`;
      }
      usedSlugs.add(candidate);
      update.slug = candidate;
      fixedSlugs += 1;
      console.log(`slug: ${post._id} "${post.title}" -> "${candidate}"`);
    }

    // Normalize legacy capitalized status to the schema enum.
    if (post.status === 'Published') {
      update.status = 'published';
      fixedStatus += 1;
    } else if (post.status === 'Draft') {
      update.status = 'draft';
      fixedStatus += 1;
    }

    if (Object.keys(update).length > 0) {
      await collection.updateOne({ _id: post._id }, { $set: update });
    }
  }

  console.log(`\nDone. Slugs backfilled: ${fixedSlugs}, statuses normalized: ${fixedStatus}.`);
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((error) => {
  console.error('backfillBlogSlugs failed:', error);
  process.exit(1);
});
