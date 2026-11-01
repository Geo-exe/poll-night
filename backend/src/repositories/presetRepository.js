import { db } from '../db.js';

export class PresetRepository {
  static findAll() {
    return db.prepare('SELECT * FROM attribute_presets ORDER BY created_at DESC').all();
  }

  static findById(id) {
    return db.prepare('SELECT * FROM attribute_presets WHERE id = ?').get(id);
  }

  static create({ id, name, attributes, created_at }) {
    db.prepare(`
      INSERT INTO attribute_presets (id, name, attributes, created_at)
      VALUES (?, ?, ?, ?)
    `).run(id, name, JSON.stringify(attributes || []), created_at);
  }

  static update(id, { name, attributes }) {
    db.prepare('UPDATE attribute_presets SET name = ?, attributes = ? WHERE id = ?')
      .run(name, JSON.stringify(attributes || []), id);
  }

  static delete(id) {
    db.prepare('DELETE FROM attribute_presets WHERE id = ?').run(id);
  }
}
