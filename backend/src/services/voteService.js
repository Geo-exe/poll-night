import crypto from 'crypto';
import { VoteRepository } from '../repositories/voteRepository.js';
import { ParticipantRepository } from '../repositories/participantRepository.js';
import { PresenceService } from './presenceService.js';

export class VoteService {
  static getSessionVotes(sessionId) {
    return VoteRepository.getVotesForSession(sessionId);
  }

  static getParticipantVotes(sessionId, participantId) {
    return VoteRepository.getVotesByParticipant(sessionId, participantId);
  }

  static submitVotes(participantId, itemId, votes, io) {
    const votesWithIds = votes.map(v => ({
      ...v,
      id: crypto.randomUUID()
    }));

    VoteRepository.insertVotes(participantId, itemId, votesWithIds);

    const participant = ParticipantRepository.findById(participantId);
    if (participant && io) {
      PresenceService.broadcastParticipantStatus(io, participant.session_id);
    }
  }
}

