import mongoose from 'mongoose';
import { config } from './env.js';

let cachedPromise = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (!cachedPromise) {
    cachedPromise = mongoose
      .connect(config.MONGODB_URI)
      .then((conn) => {
        console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      })
      .catch((error) => {
        cachedPromise = null;
        console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
        throw error;
      });
  }

  return cachedPromise;
};
