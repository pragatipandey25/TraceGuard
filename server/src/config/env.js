import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = ['JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL: Missing required environment variable ${envVar}`);
    process.exit(1);
  }
}

if (process.env.JWT_SECRET.length < 16) {
  console.warn('WARNING: JWT_SECRET should be at least 32 characters long in production.');
}

export const config = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/traceguard',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  SCAN_TIMEOUT_MS: parseInt(process.env.SCAN_TIMEOUT_MS, 10) || 15000,
  MAX_CONCURRENT_SCANS: parseInt(process.env.MAX_CONCURRENT_SCANS, 10) || 2,
  MAX_SCANS_PER_HOUR: parseInt(process.env.MAX_SCANS_PER_HOUR, 10) || 20,
  AI_API_KEY: process.env.AI_API_KEY || null,
  isProd: process.env.NODE_ENV === 'production'
};
