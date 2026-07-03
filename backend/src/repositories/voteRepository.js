import { db } from '../db.js';

export class VoteRepository {
  static getVotersForItem(itemId, categoryId = null) {
    if (categoryId) {
      return db.prepare('SELECT DISTINCT participant_id FROM votes WHERE item_id = ? AND category_id = ?').all(itemId, categoryId).map(v => v.participant_id);
    }
    return db.prepare('SELECT DISTINCT participant_id FROM votes WHERE item_id = ?').all(itemId).map(v => v.participant_id);
  }

  static getVotesForSession(sessionId) {
    return db.prepare(`
      SELECT v.* FROM votes v 
      JOIN items i ON v.item_id = i.id 
      WHERE i.session_id = ?
    `).all(sessionId);
  }

  static getVotesByParticipant(sessionId, participantId) {
    return db.prepare(`
      SELECT v.* FROM votes v 
      JOIN items i ON v.item_id = i.id 
      WHERE i.session_id = ? AND v.participant_id = ?
    `).all(sessionId, participantId);
  }

  static insertVotes(participantId, itemId, votesArray) {
    const timestamp = Date.now();
    const insertVote = db.prepare(`
      INSERT OR REPLACE INTO votes (id, participant_id, item_id, category_id, value, timestamp)
      VALUES (
        COALESCE((SELECT id FROM votes WHERE participant_id = ? AND item_id = ? AND category_id = ?), ?), 
        ?, ?, ?, ?, ?
      )
    `);
    
    const transaction = db.transaction((votes) => {
      for (const vote of votes) {
        insertVote.run(
          participantId, itemId, vote.category_id, vote.id,
          participantId, itemId, vote.category_id, vote.value, timestamp
        );
      }
    });
    
    transaction(votesArray);
  }
}

