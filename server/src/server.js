import app from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';

async function startServer() {
  await connectDB();

  const server = app.listen(config.PORT, () => {
    console.log(`[TraceGuard Server] Running on port ${config.PORT} (${config.NODE_ENV})`);
    console.log(`[TraceGuard Server] Health endpoint: http://localhost:${config.PORT}/api/health`);
  });

  // Graceful shutdown handling
  const handleExit = (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => handleExit('SIGINT'));
  process.on('SIGTERM', () => handleExit('SIGTERM'));
}

startServer();
