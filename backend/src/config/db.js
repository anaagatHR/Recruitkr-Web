import mongoose from 'mongoose';
import { Application } from '../models/Application.js';
import { env } from './env.js';

export const connectDb = async () => {
  try {
    mongoose.set('strictQuery', true);

    // Hide password in logs
    const safeUri = env.MONGODB_URI.replace(
      /(mongodb(\+srv)?:\/\/[^:]+:)([^@]+)(@.*)/,
      '$1****$4'
    );

    console.log('🔗 Mongo URI:', safeUri);

    await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 10000,
    });

    console.log('✅ Database:', mongoose.connection.name);
    console.log('✅ Host:', mongoose.connection.host);

    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    console.log('✅ Collections:');
    collections.forEach((collection) => {
      console.log('-', collection.name);
    });

    await Application.syncIndexes();

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};