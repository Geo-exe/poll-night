import crypto from 'crypto';
import { ParticipantRepository } from '../repositories/participantRepository.js';

export class AuthService {
  static registerParticipant(sessionId, username, avatar) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const partId = crypto.randomUUID();
    
    ParticipantRepository.create({
      id: partId,
      session_id: sessionId,
      username,
      avatar,
      reconnection_code: code
    });
    
    return { id: partId, reconnection_code: code, avatar };
  }

  static login(sessionId, username) {
    return ParticipantRepository.findByAuth(sessionId, username);
  }

  static reconnect(sessionId, username, code) {
    return ParticipantRepository.findByAuth(sessionId, username, code);
  }
}
