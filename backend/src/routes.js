import fs from 'fs';
import { SessionService } from './services/sessionService.js';
import { AuthService } from './services/authService.js';
import { VoteService } from './services/voteService.js';
import { PresetService } from './services/presetService.js';
import { MediaService } from './services/mediaService.js';

export default async function routes(fastify, options) {
  const io = fastify.io;

  fastify.decorate('verifyAdmin', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized access' });
    }
  });

  fastify.get('/api/uploads/:scope/:filename', async (request, reply) => {
    const upload = MediaService.resolveUpload(request.params.scope, request.params.filename);
    if (!upload) return reply.code(404).send({ error: 'Not found' });
    reply.header('Cache-Control', 'public, max-age=31536000, immutable');
    return reply.type(upload.mime).send(fs.createReadStream(upload.path));
  });

  fastify.post('/api/uploads/item', {
    preValidation: [fastify.verifyAdmin],
    bodyLimit: 8 * 1024 * 1024
  }, async (request, reply) => {
    if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
      return reply.code(400).send({ error: 'Empty upload' });
    }
    if (request.body.length > 8 * 1024 * 1024) {
      return reply.code(413).send({ error: 'Image too large' });
    }
    try {
      return { url: MediaService.saveImage(request.body, 'items') };
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ error: err.message });
    }
  });

  fastify.post('/api/uploads/avatar', {
    bodyLimit: 2 * 1024 * 1024
  }, async (request, reply) => {
    if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
      return reply.code(400).send({ error: 'Empty upload' });
    }
    if (request.body.length > 2 * 1024 * 1024) {
      return reply.code(413).send({ error: 'Image too large' });
    }
    try {
      return { url: MediaService.saveImage(request.body, 'avatars') };
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ error: err.message });
    }
  });

  fastify.post('/api/admin/login', async (request, reply) => {
    const { password } = request.body;
    if (password === process.env.ADMIN_PASSWORD) {
      const token = fastify.jwt.sign({ role: 'admin' });
      return { token };
    }
    return reply.code(401).send({ error: 'Incorrect password' });
  });

  fastify.get('/api/sessions', async (request, reply) => {
    return SessionService.getAllSessions();
  });

  fastify.get('/api/sessions/active', async (request, reply) => {
    const session = SessionService.getActiveSessionDetails();
    if (!session) return reply.code(404).send({ error: 'No active session found' });
    return session;
  });

  fastify.get('/api/sessions/:id', async (request, reply) => {
    const session = SessionService.getSessionDetails(request.params.id);
    if (!session) return reply.code(404).send({ error: 'Session not found' });
    return session;
  });

  fastify.get('/api/sessions/:id/votes', async (request, reply) => {
    return VoteService.getSessionVotes(request.params.id);
  });

  fastify.get('/api/sessions/:id/participants/:participantId/votes', async (request, reply) => {
    return VoteService.getParticipantVotes(request.params.id, request.params.participantId);
  });

  fastify.post('/api/sessions', { preValidation: [fastify.verifyAdmin] }, async (request, reply) => {
    return SessionService.createSession(request.body);
  });

  fastify.put('/api/sessions/:id', { preValidation: [fastify.verifyAdmin] }, async (request, reply) => {
    try {
      return SessionService.updateSessionConfig(request.params.id, request.body, io);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ error: err.message });
    }
  });

  fastify.get('/api/attribute-presets', { preValidation: [fastify.verifyAdmin] }, async () => {
    return PresetService.getAllPresets();
  });

  fastify.post('/api/attribute-presets', { preValidation: [fastify.verifyAdmin] }, async (request, reply) => {
    try {
      return PresetService.createPreset(request.body);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ error: err.message });
    }
  });

  fastify.put('/api/attribute-presets/:id', { preValidation: [fastify.verifyAdmin] }, async (request, reply) => {
    try {
      return PresetService.updatePreset(request.params.id, request.body);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ error: err.message });
    }
  });

  fastify.delete('/api/attribute-presets/:id', { preValidation: [fastify.verifyAdmin] }, async (request, reply) => {
    return PresetService.deletePreset(request.params.id);
  });

  fastify.put('/api/sessions/:id/status', { preValidation: [fastify.verifyAdmin] }, async (request, reply) => {
    return SessionService.updateSessionStatus(request.params.id, request.body.status, io);
  });

  fastify.put('/api/sessions/:id/closed_view', { preValidation: [fastify.verifyAdmin] }, async (request, reply) => {
    return SessionService.updateSessionClosedView(request.params.id, request.body.view, io);
  });

  fastify.put('/api/sessions/:id/closed_slide', { preValidation: [fastify.verifyAdmin] }, async (request, reply) => {
    return SessionService.updateSessionClosedSlide(request.params.id, request.body.slide, request.body.locked, io);
  });

  fastify.delete('/api/sessions/:id', { preValidation: [fastify.verifyAdmin] }, async (request, reply) => {
    return SessionService.deleteSession(request.params.id, io);
  });

  fastify.put('/api/sessions/:id/items/:itemId/status', { preValidation: [fastify.verifyAdmin] }, async (request, reply) => {
    return SessionService.updateItemVotingStatus(request.params.id, request.params.itemId, request.body.voting_status, request.body.active_category_id, io);
  });

  fastify.post('/api/sessions/:id/items/:itemId/reveal', { preValidation: [fastify.verifyAdmin] }, async (request, reply) => {
    return SessionService.revealItem(request.params.id, request.params.itemId, io);
  });

  fastify.post('/api/sessions/:id/participants', async (request, reply) => {
    try {
      return AuthService.registerParticipant(request.params.id, request.body.username, request.body.avatar);
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        // Emergency reconnect: if user exists, just log them back in!
        const existingUser = AuthService.login(request.params.id, request.body.username);
        if (existingUser) {
          return existingUser;
        }
        return reply.code(409).send({ error: 'Username already taken in this session' });
      }
      throw err;
    }
  });

  fastify.post('/api/sessions/:id/auth/login', async (request, reply) => {
    const user = AuthService.login(request.params.id, request.body.username);
    if (!user) return reply.code(401).send({ error: 'Invalid username' });
    return user;
  });

  fastify.post('/api/sessions/:id/auth/reconnect', async (request, reply) => {
    const user = AuthService.reconnect(request.params.id, request.body.username, request.body.reconnection_code);
    if (!user) return reply.code(401).send({ error: 'Invalid reconnect data' });
    return user;
  });

  fastify.post('/api/votes', async (request, reply) => {
    try {
      VoteService.submitVotes(request.body.participant_id, request.body.item_id, request.body.votes, io);
      return { success: true };
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return reply.code(409).send({ error: 'Already voted for these categories' });
      }
      throw err;
    }
  });

  fastify.delete('/api/sessions/:id/participants/:participantId', { preValidation: [fastify.verifyAdmin] }, async (request, reply) => {
    return SessionService.removeParticipant(request.params.id, request.params.participantId, io);
  });
}
