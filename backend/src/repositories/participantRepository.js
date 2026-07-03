import { db } from '../db.js';

export class ParticipantRepository {
  static findBySessionId(sessionId) {
    return db.prepare(`
      SELECT p.*,
        (SELECT COUNT(*) > 0 FROM votes v 
         JOIN items i ON v.item_id = i.id 
         JOIN sessions s ON i.session_id = s.id
         WHERE v.participant_id = p.id 
           AND i.voting_status = 'open'
           AND (s.category_mode = 'all' OR v.category_id = i.active_category_id)
        ) as has_voted_active_item
      FROM participants p 
      WHERE p.session_id = ?
    `).all(sessionId);
  }

  static findById(id) {
    return db.prepare('SELECT session_id, username, avatar, connected FROM participants WHERE id = ?').get(id);
  }

  static findByAuth(sessionId, username, code) {
    if (code) {
      return db.prepare('SELECT * FROM participants WHERE session_id = ? AND username = ? AND reconnection_code = ?').get(sessionId, username, code);
    }
    return db.prepare('SELECT * FROM participants WHERE session_id = ? AND username = ?').get(sessionId, username);
  }

  static create(participantData) {
    const { id, session_id, username, avatar, reconnection_code } = participantData;
    db.prepare(`
      INSERT INTO participants (id, session_id, username, avatar, reconnection_code, connected)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(id, session_id, username, avatar || '👤', reconnection_code);
  }

  static updateConnectionStatus(id, connectedStatus) {
    db.prepare('UPDATE participants SET connected = ? WHERE id = ?').run(connectedStatus ? 1 : 0, id);
  }

  static delete(id) {
    db.prepare('DELETE FROM participants WHERE id = ?').run(id);
  }
}
