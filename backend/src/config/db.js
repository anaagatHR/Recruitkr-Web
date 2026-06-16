import mongoose from 'mongoose';

import { Application } from '../models/Application.js';

import { env } from './env.js';

const getMongoDbName = (uri) => {
  try {
    const parsed = new URL(uri);
    const pathname = parsed.pathname.replace(/^\/+/, '');
    return pathname || null;
  } catch {
    return null;
  }
};

const setMongoDbName = (uri, dbName) => {
  const parsed = new URL(uri);
  parsed.pathname = `/${dbName}`;
  return parsed.toString();
};

const stripMongoDbName = (uri) => {
  const parsed = new URL(uri);
  parsed.pathname = '/';
  return parsed.toString();
};

export const connectDb = async () => {
  mongoose.set('strictQuery', true);

  const requestedDbName = getMongoDbName(env.MONGODB_URI);
  let mongoUri = env.MONGODB_URI;

  if (requestedDbName) {
    const probeClient = new mongoose.mongo.MongoClient(stripMongoDbName(env.MONGODB_URI));

    try {
      await probeClient.connect();

      const databases = await probeClient.db().admin().listDatabases();
      const match = databases.databases.find(
        (database) => database.name.toLowerCase() === requestedDbName.toLowerCase(),
      );

      if (match?.name && match.name !== requestedDbName) {
        mongoUri = setMongoDbName(env.MONGODB_URI, match.name);
        console.warn(
          `[db] normalized MongoDB name "${requestedDbName}" to existing database "${match.name}"`,
        );
      }
    } finally {
      await probeClient.close().catch(() => {});
    }
  }

  await mongoose.connect(mongoUri, {
    autoIndex: env.NODE_ENV !== 'production',
    serverSelectionTimeoutMS: 10000,
  });

  // Keep application indexes aligned without forcing unrelated legacy collections
  // to rebuild unique indexes during startup.
  await Application.syncIndexes();
};

