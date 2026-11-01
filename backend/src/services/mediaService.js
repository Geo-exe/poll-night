import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads');
const UPLOAD_SCOPES = new Set(['items', 'avatars']);

const MIME_BY_EXTENSION = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
};

const normalizeScope = (scope) => {
  if (scope === 'item') return 'items';
  if (scope === 'avatar') return 'avatars';
  return UPLOAD_SCOPES.has(scope) ? scope : null;
};

const ensureDirectory = (directory) => {
  fs.mkdirSync(directory, { recursive: true });
};

const decodeDataUrl = (dataUrl) => {
  const match = /^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,(.+)$/i.exec(dataUrl || '');
  if (!match) return null;

  const mime = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
  const extension = mime === 'image/png'
    ? '.png'
    : mime === 'image/webp'
      ? '.webp'
      : mime === 'image/gif'
        ? '.gif'
        : '.jpg';

  return { extension, buffer: Buffer.from(match[2], 'base64') };
};

export class MediaService {
  static get uploadRoot() {
    return UPLOAD_ROOT;
  }

  static saveImage(buffer, scope) {
    const normalizedScope = normalizeScope(scope);
    if (!normalizedScope) {
      const err = new Error('Invalid upload scope');
      err.statusCode = 400;
      throw err;
    }
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      const err = new Error('Empty upload');
      err.statusCode = 400;
      throw err;
    }

    const directory = path.join(UPLOAD_ROOT, normalizedScope);
    ensureDirectory(directory);
    const fileName = `${crypto.randomUUID()}.jpg`;
    fs.writeFileSync(path.join(directory, fileName), buffer);
    return `/api/uploads/${normalizedScope}/${fileName}`;
  }

  static resolveUpload(scope, fileName) {
    const normalizedScope = normalizeScope(scope);
    if (!normalizedScope) return null;
    if (!/^[a-f0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(fileName || '')) return null;

    const directory = path.resolve(UPLOAD_ROOT, normalizedScope);
    const filePath = path.resolve(directory, fileName);
    if (!filePath.startsWith(`${directory}${path.sep}`)) return null;
    if (!fs.existsSync(filePath)) return null;

    return {
      path: filePath,
      mime: MIME_BY_EXTENSION[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
    };
  }

  static migrateInlineImages() {
    ensureDirectory(path.join(UPLOAD_ROOT, 'items'));
    ensureDirectory(path.join(UPLOAD_ROOT, 'avatars'));

    let migrated = 0;

    const migrateRows = (rows, scope, updateSql) => {
      const update = db.prepare(updateSql);
      rows.forEach(row => {
        const decoded = decodeDataUrl(row.value);
        if (!decoded) {
          console.warn(`[media] Skipped invalid inline image for ${scope} ${row.id}`);
          return;
        }

        try {
          const fileName = `${crypto.randomUUID()}${decoded.extension}`;
          fs.writeFileSync(path.join(UPLOAD_ROOT, scope, fileName), decoded.buffer);
          update.run(`/api/uploads/${scope}/${fileName}`, row.id);
          migrated += 1;
        } catch (err) {
          console.warn(`[media] Could not migrate inline image for ${scope} ${row.id}: ${err.message}`);
        }
      });
    };

    const itemRows = db.prepare("SELECT id, image_url AS value FROM items WHERE image_url LIKE 'data:image/%'").all();
    migrateRows(itemRows, 'items', 'UPDATE items SET image_url = ? WHERE id = ?');

    const avatarRows = db.prepare("SELECT id, avatar AS value FROM participants WHERE avatar LIKE 'data:image/%'").all();
    migrateRows(avatarRows, 'avatars', 'UPDATE participants SET avatar = ? WHERE id = ?');

    if (migrated > 0) {
      console.log(`[media] Migrated ${migrated} inline image(s) to ${UPLOAD_ROOT}`);
    }
  }

  static cleanupOrphans({ maxAgeMs = 24 * 60 * 60 * 1000 } = {}) {
    const referenced = new Set();
    db.prepare('SELECT image_url AS value FROM items WHERE image_url IS NOT NULL').all()
      .forEach(row => referenced.add(row.value));
    db.prepare('SELECT avatar AS value FROM participants WHERE avatar IS NOT NULL').all()
      .forEach(row => referenced.add(row.value));

    const now = Date.now();
    let removed = 0;

    UPLOAD_SCOPES.forEach(scope => {
      const directory = path.join(UPLOAD_ROOT, scope);
      if (!fs.existsSync(directory)) return;

      fs.readdirSync(directory).forEach(fileName => {
        const relativeUrl = `/api/uploads/${scope}/${fileName}`;
        if (referenced.has(relativeUrl)) return;

        const filePath = path.join(directory, fileName);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
          removed += 1;
        }
      });
    });

    if (removed > 0) {
      console.log(`[media] Removed ${removed} orphan image(s)`);
    }
  }
}
