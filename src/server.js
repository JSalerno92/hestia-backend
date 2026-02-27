import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { initSockets } from './socket/index.js';

export function createServer() {
  const app = createApp();
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  initSockets(io);

  return { httpServer, io };
}
