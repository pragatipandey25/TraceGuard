import app from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';

async function startServer() {
  await connectDB();

  const server = app.listen(config.PORT, () => {
    console.log(`[TraceGuard Server] Running on port ${config.PORT} (${config.NODE_ENV})`);
    console.log(`[TraceGuard Server] Health endpoint: http://localhost:${config.PORT}/api/health`);
    if (config.AI_API_KEY && config.AI_API_KEY.trim()) {
      const type = (config.AI_API_KEY.startsWith('AIza') || config.AI_API_KEY.startsWith('AQ.')) ? 'Google Gemini' : config.AI_API_KEY.startsWith('sk-') ? 'OpenAI' : 'Custom Provider';
      console.log(`[TraceGuard Server] AI Assistant: Active (${type})`);
    } else {
      console.log(`[TraceGuard Server] AI Assistant: Built-in Offline Knowledge Engine`);
    }
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

startServer().catch((error) => {
  console.error(`[TraceGuard Server] Failed to start: ${error.message}`);
  process.exitCode = 1;
});
