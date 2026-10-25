import app from '../server/src/app.js';
import mongoose from 'mongoose';
import { connectDB } from '../server/src/config/db.js';

let connectionPromise;

async function ensureDatabaseConnection() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!connectionPromise) {
    connectionPromise = connectDB().catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }

  await connectionPromise;
}

export default async function handler(req, res) {
  await ensureDatabaseConnection();
  return app(req, res);
}
