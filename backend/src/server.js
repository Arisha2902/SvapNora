'use strict';

const { env } = require('./config/env');
const logger = require('./utils/logger');
const { connectDB, disconnectDB } = require('./config/db');

async function main() {
  await connectDB();

  const app = require('./app');
  const server = app.listen(env.PORT, () => {
    logger.info(`KINETIC API listening on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Allowed origin: ${env.CLIENT_URL}`);
  });

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.warn(`${signal} received → shutting down gracefully`);

    const forceExit = setTimeout(() => {
      logger.error('Forced shutdown after 10s timeout');
      process.exit(1);
    }, 10000);
    forceExit.unref();

    server.close(async () => {
      await disconnectDB().catch((err) => logger.error(`Disconnect failed: ${err.message}`));
      logger.info('Shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled rejection: ${reason && reason.stack ? reason.stack : reason}`);
  });
  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught exception: ${err.stack || err.message}`);
    shutdown('uncaughtException');
  });
}

main().catch((err) => {
  logger.error(`Fatal startup error: ${err.stack || err.message}`);
  process.exit(1);
});
