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

  /** Si la URI no incluye el nombre de la base (o apunta a otra), fijá acá la misma que en Atlas (ej. vetfichas-db). */
  const dbName = process.env.STORAGE_MONGODB_DB?.trim() || undefined;
  const connectOptions = dbName ? { dbName } : undefined;

  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, connectOptions);
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
