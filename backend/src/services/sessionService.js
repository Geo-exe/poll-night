import crypto from 'crypto';
import { SessionRepository } from '../repositories/sessionRepository.js';
import { CategoryRepository } from '../repositories/categoryRepository.js';
import { ItemRepository } from '../repositories/itemRepository.js';
import { ParticipantRepository } from '../repositories/participantRepository.js';
import { VoteRepository } from '../repositories/voteRepository.js';
import { PresenceService } from './presenceService.js';

export class SessionService {
  static getAllSessions() {
    return SessionRepository.findAll();
  }

  static getActiveSessionDetails() {
    const sessions = SessionRepository.findAll();
    const active = sessions.find(s => ['setup', 'joining', 'voting', 'closed'].includes(s.status));
    if (!active) return null;
    return this.getSessionDetails(active.id);
  }

  static getSessionDetails(id) {
    const session = SessionRepository.findById(id);
    if (!session) return null;
    
    session.categories = CategoryRepository.findBySessionId(id);
    session.items = ItemRepository.findBySessionId(id);
    session.participants = ParticipantRepository.findBySessionId(id) || [];
    
    const allVotes = VoteRepository.getVotesForSession(id);
    session.items = session.items.map(item => {
      const itemVotes = allVotes.filter(v => v.item_id === item.id);
      const uniqueVoters = new Set(itemVotes.map(v => v.participant_id)).size;
      
      const categoryAverages = {};
      session.categories.forEach(cat => {
        const catVotes = itemVotes.filter(v => v.category_id === cat.id);
        if (catVotes.length > 0) {
          const sum = catVotes.reduce((acc, v) => acc + v.value, 0);
          categoryAverages[cat.id] = parseFloat((sum / catVotes.length).toFixed(1));
        } else {
          categoryAverages[cat.id] = 0;
        }
      });

      let parsedAttributes = [];
      try {
        parsedAttributes = typeof item.attributes === 'string' ? JSON.parse(item.attributes) : (item.attributes || []);
      } catch (e) {
        parsedAttributes = [];
      }

      return { ...item, vote_count: uniqueVoters, category_averages: categoryAverages, attributes: parsedAttributes };
    });
    
    // Find item that is open, or the one that is revealed
    const activeItem = session.items.find(i => i.voting_status === 'open' || i.revealed);
    
    session.participants = session.participants.map(p => ({
      ...p,
      has_voted_active_item: !!p.has_voted_active_item
    }));

    return session;
  }

  static createSession(data) {
    const { name, date, blind_mode = true, reveal_mode = 'per_item', category_mode = 'all', results_mode = 'per_item', categories = [], items = [] } = data;
    const id = crypto.randomUUID();
    
    SessionRepository.create({
      id,
      name,
      date,
      blind_mode,
      reveal_mode,
      category_mode,
      results_mode,
      created_at: Date.now()
    });
    
    categories.forEach((c, idx) => {
      CategoryRepository.create({
        id: crypto.randomUUID(),
        session_id: id,
        name: c.name,
        scale: c.scale,
        weight: c.weight,
        display_order: c.display_order ?? idx
      });
    });

    items.forEach((item, idx) => {
      ItemRepository.create({
        id: crypto.randomUUID(),
        session_id: id,
        public_name: item.public_name,
        real_name: item.real_name,
        display_order: item.display_order ?? idx,
        image_url: item.image_url,
        attributes: item.attributes || []
      });
    });

    return { id, name, status: 'setup' };
  }

  static updateSessionStatus(id, status, io) {
    SessionRepository.updateStatus(id, status);
    if (io) io.to(id).emit('session_state_changed', { status });
    return { success: true, status };
  }

  static updateSessionClosedView(id, view, io) {
    SessionRepository.updateClosedView(id, view);
    if (io) io.to(id).emit('session_state_changed', { closed_view: view });
    return { success: true, closed_view: view };
  }

  static deleteSession(id, io) {
    SessionRepository.deleteSession(id);
    if (io) {
      io.to(id).emit('session_deleted');
    }
    return { success: true };
  }

  static updateItemVotingStatus(sessionId, itemId, voting_status, active_category_id = null, io) {
    ItemRepository.updateVotingStatus(itemId, sessionId, voting_status);
    if (active_category_id !== undefined) {
      ItemRepository.updateActiveCategory(itemId, sessionId, active_category_id);
    }
    
    if (io) {
      let category_averages = null;
      let vote_count = undefined;
      if (voting_status === 'closed') {
        const sessionData = this.getSessionDetails(sessionId);
        const updatedItem = sessionData.items.find(i => i.id === itemId);
        if (updatedItem) {
          category_averages = updatedItem.category_averages;
          vote_count = updatedItem.vote_count;
        }
      }

      const item = ItemRepository.findById(itemId);
      io.to(sessionId).emit('active_item_changed', { 
        itemId: item.id, 
        public_name: item.public_name, 
        voting_status,
        active_category_id: item.active_category_id,
        category_averages,
        vote_count
      });
      PresenceService.broadcastParticipantStatus(io, sessionId);
    }
    return { success: true, voting_status };
  }

  static revealItem(sessionId, itemId, io) {
    ItemRepository.revealItem(itemId, sessionId);
    const item = ItemRepository.findById(itemId);
    
    if (io) {
      io.to(sessionId).emit('item_revealed', { itemId: item.id, real_name: item.real_name });
    }
    return { success: true, item };
  }

  static removeParticipant(sessionId, participantId, io) {
    ParticipantRepository.delete(participantId);
    if (io) {
      io.to(sessionId).emit('participant_kicked', { participantId });
      PresenceService.broadcastParticipantStatus(io, sessionId);
    }
    return { success: true };
  }
}
