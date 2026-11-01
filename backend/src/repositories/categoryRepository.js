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

  static update(id, { name, scale, weight, display_order }) {
    db.prepare(`
      UPDATE categories SET name = ?, scale = ?, weight = ?, display_order = ? WHERE id = ?
    `).run(name, scale || '1-10', weight || 1.0, display_order, id);
  }

  static delete(id) {
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }
}
