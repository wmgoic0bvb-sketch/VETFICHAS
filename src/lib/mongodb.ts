import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var -- Next.js hot reload guard
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};
global.mongooseCache = cache;

export async function connectMongo(): Promise<typeof mongoose> {
  const uri = process.env.STORAGE_MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Missing STORAGE_MONGODB_URI — add it to your environment (e.g. .env.local).",
    );
  }

  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(uri);
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
