import app from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('Serverless database connection failure:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to establish database connection in serverless environment.',
      error: error.message
    });
  }
}
