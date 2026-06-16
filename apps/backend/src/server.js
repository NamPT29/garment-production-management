import http from 'node:http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { initSocket } from './services/socket.service.js';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
  },
});

initSocket(io);

const startServer = async () => {
  try {
    await connectDatabase();
    server.listen(env.BACKEND_PORT, () => {
      console.log(`Backend dang chay tai http://localhost:${env.BACKEND_PORT}`);
      console.log(`Swagger tai http://localhost:${env.BACKEND_PORT}/api/docs`);
    });
  } catch (error) {
    console.error('Khong the khoi dong backend', error);
    process.exit(1);
  }
};

const shutdown = async () => {
  console.log('Dang tat backend...');
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

void startServer();
