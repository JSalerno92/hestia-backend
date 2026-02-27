// src/index.js
import { config } from './config/env.js';
import { createServer } from './server.js';
import { registerIO } from './socket/events.js';
import pool from './db/index.js';
import { initializeDatabase } from './utils/initializeDb.js';

async function bootstrap() {
  console.log('🟢 Bootstrapping backend...');

  await initializeDatabase(pool);

  const { httpServer, io } = createServer();
  registerIO(io);

  httpServer.listen(config.port, () => {
    console.log(`🚀 Backend escuchando en http://localhost:${config.port}`);
  });
}

bootstrap().catch(err => {
  console.error('❌ Fatal error during bootstrap', err);
  process.exit(1);
});

console.log('ENV:', {
  port: config.port,
  db: config.databaseUrl
});
