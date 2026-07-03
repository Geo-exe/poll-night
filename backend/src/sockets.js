import { PresenceService } from './services/presenceService.js';

export default function setupSockets(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_session', ({ sessionId, role, userId }) => {
      socket.join(sessionId);
      socket.sessionId = sessionId;
      console.log(`Socket ${socket.id} joined session ${sessionId} as ${role}`);
      
      if (role === 'participant' && userId) {
        socket.userId = userId;
        try {
          PresenceService.updateConnection(userId, true);
          PresenceService.broadcastParticipantStatus(io, sessionId);
        } catch (err) {
          console.error('Error updating participant status:', err);
        }
      }
    });

    socket.on('chat_message', ({ sessionId, userId, username, avatar, text }) => {
      if (sessionId && text) {
        io.to(sessionId).emit('chat_message', {
          id: Date.now() + Math.random().toString(36).substring(7),
          userId,
          username,
          avatar,
          text,
          timestamp: Date.now()
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      if (socket.userId && socket.sessionId) {
        try {
          PresenceService.updateConnection(socket.userId, false);
          PresenceService.broadcastParticipantStatus(io, socket.sessionId);
        } catch (err) {
          console.error('Error updating participant status on disconnect:', err);
        }
      }
    });
  });
}
