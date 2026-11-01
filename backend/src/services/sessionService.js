import crypto from 'crypto';
import { SessionRepository } from '../repositories/sessionRepository.js';
import { CategoryRepository } from '../repositories/categoryRepository.js';
import { ItemRepository } from '../repositories/itemRepository.js';
import { ParticipantRepository } from '../repositories/participantRepository.js';
import { VoteRepository } from '../repositories/voteRepository.js';
import { PresenceService } from './presenceService.js';

const parseAttributes = (value) => {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

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
    
    session.shared_attributes = parseAttributes(session.shared_attributes);
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
      has_voted_active_item: !!p.has_voted_active_item,
      has_voted_current_round: !!p.has_voted_current_round
    }));

    return session;
  }

  static createSession(data) {
    const { name, date, blind_mode = true, reveal_mode = 'per_item', category_mode = 'all', results_mode = 'per_item', shared_attributes = [], categories = [], items = [] } = data;
    const id = crypto.randomUUID();
    
    SessionRepository.create({
      id,
      name,
      date,
      blind_mode,
      reveal_mode,
      category_mode,
      results_mode,
      shared_attributes,
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

  static updateSessionConfig(id, data, io) {
    const session = SessionRepository.findById(id);
    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }
    if (!['setup', 'joining'].includes(session.status)) {
      const err = new Error('Session can only be edited before voting starts');
      err.statusCode = 409;
      throw err;
    }

    const existingVotes = VoteRepository.getVotesForSession(id);
    if (existingVotes.length > 0) {
      const err = new Error('Session already has votes and cannot be edited');
      err.statusCode = 409;
      throw err;
    }

    const {
      name = session.name,
      date = session.date,
      blind_mode = Boolean(session.blind_mode),
      reveal_mode = session.reveal_mode,
      category_mode = session.category_mode,
      results_mode = session.results_mode,
      shared_attributes = parseAttributes(session.shared_attributes),
      categories = [],
      items = []
    } = data;

    SessionRepository.updateDetails(id, {
      name,
      date,
      blind_mode,
      reveal_mode,
      category_mode,
      results_mode,
      shared_attributes
    });

    const existingCategories = CategoryRepository.findBySessionId(id);
    const keptCategoryIds = new Set(categories.filter(c => c.id).map(c => c.id));
    existingCategories
      .filter(c => !keptCategoryIds.has(c.id))
      .forEach(c => CategoryRepository.delete(c.id));

    categories.forEach((category, idx) => {
      const payload = {
        name: category.name,
        scale: category.scale,
        weight: category.weight,
        display_order: idx
      };
      if (category.id && existingCategories.some(c => c.id === category.id)) {
        CategoryRepository.update(category.id, payload);
      } else {
        CategoryRepository.create({
          id: crypto.randomUUID(),
          session_id: id,
          ...payload
        });
      }
    });

    const existingItems = ItemRepository.findBySessionId(id);
    const keptItemIds = new Set(items.filter(item => item.id).map(item => item.id));
    existingItems
      .filter(item => !keptItemIds.has(item.id))
      .forEach(item => ItemRepository.delete(item.id));

    items.forEach((item, idx) => {
      const payload = {
        public_name: item.public_name,
        real_name: item.real_name,
        display_order: idx,
        image_url: item.image_url,
        attributes: item.attributes || []
      };
      if (item.id && existingItems.some(existing => existing.id === item.id)) {
        ItemRepository.update(item.id, payload);
      } else {
        ItemRepository.create({
          id: crypto.randomUUID(),
          session_id: id,
          ...payload
        });
      }
    });

    const updated = this.getSessionDetails(id);
    if (io) {
      io.to(id).emit('session_config_updated', updated);
    }
    return updated;
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

  static updateSessionClosedSlide(id, slide, locked, io) {
    const safeSlide = Math.max(0, Number.parseInt(slide, 10) || 0);
    const safeLocked = Boolean(locked);
    SessionRepository.updateClosedSlide(id, safeSlide, safeLocked);
    if (io) {
      io.to(id).emit('session_state_changed', {
        closed_slide: safeSlide,
        closed_slide_locked: safeLocked ? 1 : 0
      });
    }
    return { success: true, closed_slide: safeSlide, closed_slide_locked: safeLocked ? 1 : 0 };
  }

  static deleteSession(id, io) {
    SessionRepository.deleteSession(id);
    if (io) {
      io.to(id).emit('session_deleted');
    }
    return { success: true };
  }

  static updateItemVotingStatus(sessionId, itemId, voting_status, active_category_id = null, io) {
    if (voting_status === 'open') {
      ItemRepository.openVoting(itemId, sessionId);
    } else {
      ItemRepository.updateVotingStatus(itemId, sessionId, voting_status);
    }
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
        voting_opened_at: item.voting_opened_at,
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
