require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start the HTTP server
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`[+] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[+] Health check: http://localhost:${PORT}/health`);
  });

  // ─── Graceful shutdown ─────────────────────────────────────────────────
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('[+] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ─── Unhandled promise rejections ──────────────────────────────────────
  process.on('unhandledRejection', (err) => {
    console.error('[-] Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
  });
});
