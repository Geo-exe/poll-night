import { db } from '../db.js';

export class ItemRepository {
  static findBySessionId(sessionId) {
    return db.prepare('SELECT id, public_name, real_name, display_order, image_url, voting_status, revealed, active_category_id, attributes FROM items WHERE session_id = ? ORDER BY display_order').all(sessionId);
  }

  static findById(id) {
    return db.prepare('SELECT id, public_name, real_name, display_order, image_url, voting_status, revealed, active_category_id, attributes FROM items WHERE id = ?').get(id);
  }

  static findActiveItem(sessionId) {
    return db.prepare("SELECT id, active_category_id FROM items WHERE session_id = ? AND voting_status = 'open'").get(sessionId);
  }

  static create(itemData) {
    const { id, session_id, public_name, real_name, display_order, image_url, attributes } = itemData;
    db.prepare(`
      INSERT INTO items (id, session_id, public_name, real_name, voting_status, display_order, image_url, attributes)
      VALUES (?, ?, ?, ?, 'closed', ?, ?, ?)
    `).run(id, session_id, public_name, real_name || null, display_order, image_url || null, JSON.stringify(attributes || []));
  }

  static updateVotingStatus(id, sessionId, status) {
    db.prepare('UPDATE items SET voting_status = ? WHERE id = ? AND session_id = ?').run(status, id, sessionId);
  }

  static updateActiveCategory(id, sessionId, categoryId) {
    db.prepare('UPDATE items SET active_category_id = ? WHERE id = ? AND session_id = ?').run(categoryId, id, sessionId);
  }

  static revealItem(id, sessionId) {
    db.prepare("UPDATE items SET revealed = 1, voting_status = 'closed' WHERE id = ? AND session_id = ?").run(id, sessionId);
  }
}
