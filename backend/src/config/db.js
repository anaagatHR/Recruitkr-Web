import mongoose from 'mongoose';
import { Application } from '../models/Application.js';
import { env } from './env.js';

// Indexes for collections that are managed by the RecruitKr CRM Web Panel and
// therefore have no Mongoose model here (we only read them via the raw driver).
// Mongoose's syncIndexes() can't cover them, so we ensure them explicitly on
// connect. createIndex is idempotent — existing indexes are left untouched.
const CRM_COLLECTION_INDEXES = {
  activities: [
    { key: { user_id: 1 }, name: 'user_id_1' },
    { key: { module: 1 }, name: 'module_1' },
    { key: { user_id: 1, module: 1, created_at: -1 }, name: 'user_id_1_module_1_created_at_-1' },
  ],
  users: [{ key: { role: 1 }, name: 'role_1' }],
  workflow_logs: [
    { key: { rule_id: 1 }, name: 'rule_id_1' },
    { key: { event: 1 }, name: 'event_1' },
    { key: { rule_id: 1, created_at: -1 }, name: 'rule_id_1_created_at_-1' },
  ],
  jobs: [
    { key: { department: 1 }, name: 'department_1' },
    { key: { location: 1 }, name: 'location_1' },
    { key: { department: 1, location: 1 }, name: 'department_1_location_1' },
  ],
};

const ensureCrmCollectionIndexes = async () => {
  const db = mongoose.connection.db;
  for (const [collection, specs] of Object.entries(CRM_COLLECTION_INDEXES)) {
    for (const spec of specs) {
      try {
        await db.collection(collection).createIndex(spec.key, {
          name: spec.name,
          background: true,
        });
      } catch (error) {
        // Non-fatal: a missing index only slows queries, it shouldn't block boot.
        console.warn(`⚠️  Index ${collection}.${spec.name} not ensured:`, error.message);
      }
    }
  }
};

export const connectDb = async () => {
  try {
    mongoose.set('strictQuery', true);

    // Runtime resilience: if Atlas/Mongo drops mid-flight the driver reconnects
    // automatically — we only log so the event is visible. Never exit here;
    // killing the process would disconnect every active user for a blip that
    // usually heals in seconds.
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected — driver will auto-reconnect');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB runtime error:', error?.message || error);
    });

    // Hide password in logs
    const safeUri = env.MONGODB_URI.replace(
      /(mongodb(\+srv)?:\/\/[^:]+:)([^@]+)(@.*)/,
      '$1****$4'
    );

    console.log('🔗 Mongo URI:', safeUri);

    await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 10000,
      // Cap the connection pool. The driver default (100) opens far more sockets
      // than a single small instance needs and can exhaust a shared-tier Atlas
      // connection limit under load; a bounded pool with a warm minimum keeps
      // latency low without starving the cluster. 10 is plenty for a single
      // 0.5-CPU Render instance and saves ~10-50MB vs 20. Tunable via MONGO_MAX_POOL.
      maxPoolSize: Math.max(5, Number(process.env.MONGO_MAX_POOL) || 10),
      minPoolSize: 2,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Database:', mongoose.connection.name);
    console.log('✅ Host:', mongoose.connection.host);

    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    console.log(`✅ Collections: ${collections.length}`);

    await Application.syncIndexes();
    await ensureCrmCollectionIndexes();

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};