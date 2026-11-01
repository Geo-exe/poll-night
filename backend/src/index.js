import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { Server } from 'socket.io';
import { initDb } from './db.js';
import { MediaService } from './services/mediaService.js';
import routes from './routes.js';
import setupSockets from './sockets.js';

initDb();
MediaService.migrateInlineImages();
MediaService.cleanupOrphans();

const fastify = Fastify({
  logger: true,
  // Session payloads now contain image URLs, not base64 data.
  bodyLimit: 10 * 1024 * 1024
});

fastify.addContentTypeParser(
  'image/jpeg',
  { parseAs: 'buffer', bodyLimit: 10 * 1024 * 1024 },
  (request, body, done) => done(null, body)
);

await fastify.register(cors, {
  origin: '*'
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'fallback_secret_key'
});

const io = new Server(fastify.server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

fastify.decorate('io', io);
setupSockets(io);

fastify.register(routes);

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
