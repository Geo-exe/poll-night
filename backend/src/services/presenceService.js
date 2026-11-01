import { ParticipantRepository } from '../repositories/participantRepository.js';
import { ItemRepository } from '../repositories/itemRepository.js';
import { VoteRepository } from '../repositories/voteRepository.js';
import { SessionRepository } from '../repositories/sessionRepository.js';

export class PresenceService {
  static updateConnection(userId, isConnected) {
    ParticipantRepository.updateConnectionStatus(userId, isConnected);
  }

  static broadcastParticipantStatus(io, sessionId) {
    const participants = ParticipantRepository.findBySessionId(sessionId);
    
    const statusList = participants.map(p => ({
      id: p.id,
      username: p.username,
      avatar: p.avatar,
      connected: p.connected,
      has_voted_active_item: !!p.has_voted_active_item,
      has_voted_current_round: !!p.has_voted_current_round
    }));

    io.to(sessionId).emit('participant_status_update', { participants: statusList });
  }
}
