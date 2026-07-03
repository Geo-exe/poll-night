import { db } from '../db.js';

export class CategoryRepository {
  static findBySessionId(sessionId) {
    return db.prepare('SELECT * FROM categories WHERE session_id = ? ORDER BY display_order').all(sessionId);
  }

  static create(categoryData) {
    const { id, session_id, name, scale, weight, display_order } = categoryData;
    db.prepare(`
      INSERT INTO categories (id, session_id, name, scale, weight, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, session_id, name, scale || '1-10', weight || 1.0, display_order);
  }
}
