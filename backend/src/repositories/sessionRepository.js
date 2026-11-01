import { db } from '../db.js';

export class SessionRepository {
  static findAll() {
    return db.prepare('SELECT * FROM sessions ORDER BY created_at DESC').all();
  }

  static findById(id) {
    return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  }

  static create(sessionData) {
    const { id, name, date, blind_mode, reveal_mode, category_mode, results_mode, shared_attributes, created_at } = sessionData;
    db.prepare(`
      INSERT INTO sessions (id, name, date, status, blind_mode, reveal_mode, category_mode, results_mode, shared_attributes, created_at)
      VALUES (?, ?, ?, 'setup', ?, ?, ?, ?, ?, ?)
    `).run(id, name, date, blind_mode ? 1 : 0, reveal_mode, category_mode, results_mode, JSON.stringify(shared_attributes || []), created_at);
  }

  static updateDetails(id, sessionData) {
    const { name, date, blind_mode, reveal_mode, category_mode, results_mode, shared_attributes } = sessionData;
    db.prepare(`
      UPDATE sessions
      SET name = ?, date = ?, blind_mode = ?, reveal_mode = ?, category_mode = ?, results_mode = ?, shared_attributes = ?
      WHERE id = ?
    `).run(name, date, blind_mode ? 1 : 0, reveal_mode, category_mode, results_mode, JSON.stringify(shared_attributes || []), id);
  }

  static updateStatus(id, status) {
    db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run(status, id);
  }

  static updateClosedView(id, view) {
    db.prepare('UPDATE sessions SET closed_view = ? WHERE id = ?').run(view, id);
  }

  static updateClosedSlide(id, slide, locked) {
    db.prepare('UPDATE sessions SET closed_slide = ?, closed_slide_locked = ? WHERE id = ?')
      .run(slide, locked ? 1 : 0, id);
  }

  static deleteSession(id) {
    db.prepare('DELETE FROM votes WHERE item_id IN (SELECT id FROM items WHERE session_id = ?)').run(id);
    db.prepare('DELETE FROM items WHERE session_id = ?').run(id);
    db.prepare('DELETE FROM categories WHERE session_id = ?').run(id);
    db.prepare('DELETE FROM participants WHERE session_id = ?').run(id);
    db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  }
}
