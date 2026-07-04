import { SessionService } from './services/sessionService.js';
import { AuthService } from './services/authService.js';
import { VoteService } from './services/voteService.js';

export default async function routes(fastify, options) {
  const io = fastify.io;

  fastify.decorate('verifyAdmin', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized access' });
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

  fastify.put('/api/sessions/:id/status', { preValidation: [fastify.verifyAdmin] }, async (request, reply) => {
    return SessionService.updateSessionStatus(request.params.id, request.body.status, io);
  });

  fastify.put('/api/sessions/:id/closed_view', { preValidation: [fastify.verifyAdmin] }, async (request, reply) => {
    return SessionService.updateSessionClosedView(request.params.id, request.body.view, io);
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
