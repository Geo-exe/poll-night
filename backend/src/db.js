import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../poll-night.db');

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (  
      id TEXT PRIMARY KEY,  
      name TEXT NOT NULL,  
      date TEXT NOT NULL,  
      status TEXT NOT NULL CHECK (status IN ('setup', 'joining', 'voting', 'closed', 'archived')),  
      blind_mode INTEGER NOT NULL DEFAULT 1,  
      reveal_mode TEXT NOT NULL CHECK (reveal_mode IN ('per_item', 'end_of_event')),  
      category_mode TEXT NOT NULL DEFAULT 'all',
      results_mode TEXT NOT NULL DEFAULT 'per_item',
      created_at INTEGER NOT NULL  
    );

    CREATE TABLE IF NOT EXISTS categories (  
      id TEXT PRIMARY KEY,  
      session_id TEXT NOT NULL,  
      name TEXT NOT NULL,  
      scale TEXT NOT NULL CHECK (scale IN ('1-5', '1-10')),  
      weight REAL NOT NULL DEFAULT 1.0,  
      display_order INTEGER NOT NULL,  
      active INTEGER NOT NULL DEFAULT 1,  
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE  
    );

    CREATE TABLE IF NOT EXISTS items (  
      id TEXT PRIMARY KEY,  
      session_id TEXT NOT NULL,  
      public_name TEXT NOT NULL,  
      real_name TEXT,  
      voting_status TEXT NOT NULL CHECK (voting_status IN ('closed', 'open')),  
      revealed INTEGER NOT NULL DEFAULT 0,  
      display_order INTEGER NOT NULL,  
      image_url TEXT,
      active_category_id TEXT,
      attributes TEXT DEFAULT '[]',
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE  
    );

    CREATE TABLE IF NOT EXISTS participants (  
      id TEXT PRIMARY KEY,  
      session_id TEXT NOT NULL,  
      username TEXT NOT NULL,  
      reconnection_code TEXT NOT NULL,  
      connected INTEGER NOT NULL DEFAULT 0,  
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,  
      UNIQUE(session_id, username)  
    );

    CREATE TABLE IF NOT EXISTS votes (  
      id TEXT PRIMARY KEY,  
      participant_id TEXT NOT NULL,  
      item_id TEXT NOT NULL,  
      category_id TEXT NOT NULL,  
      value INTEGER NOT NULL,  
      timestamp INTEGER NOT NULL,  
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,  
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,  
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,  
      UNIQUE(participant_id, item_id, category_id)  
    );
  `);

  try {
    db.exec("ALTER TABLE participants ADD COLUMN avatar TEXT NOT NULL DEFAULT '👤'");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE sessions ADD COLUMN category_mode TEXT NOT NULL DEFAULT 'all'");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE sessions ADD COLUMN results_mode TEXT NOT NULL DEFAULT 'per_item'");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE items ADD COLUMN active_category_id TEXT");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE items ADD COLUMN attributes TEXT DEFAULT '[]'");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE sessions ADD COLUMN closed_view TEXT NOT NULL DEFAULT 'review'");
  } catch (e) {}

  try {
    const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='sessions'").get();
    if (tableInfo && !tableInfo.sql.includes('archived')) {
      db.pragma('foreign_keys=off');
      db.exec(`
        BEGIN TRANSACTION;
        CREATE TABLE IF NOT EXISTS new_sessions (  
          id TEXT PRIMARY KEY,  
          name TEXT NOT NULL,  
          date TEXT NOT NULL,  
          status TEXT NOT NULL CHECK (status IN ('setup', 'joining', 'voting', 'closed', 'archived')),  
          blind_mode INTEGER NOT NULL DEFAULT 1,  
          reveal_mode TEXT NOT NULL CHECK (reveal_mode IN ('per_item', 'end_of_event')),  
          category_mode TEXT NOT NULL DEFAULT 'all',
          results_mode TEXT NOT NULL DEFAULT 'per_item',
          created_at INTEGER NOT NULL,
          closed_view TEXT NOT NULL DEFAULT 'review'
        );
        INSERT INTO new_sessions SELECT id, name, date, status, blind_mode, reveal_mode, category_mode, results_mode, created_at, closed_view FROM sessions;
        DROP TABLE sessions;
        ALTER TABLE new_sessions RENAME TO sessions;
        COMMIT;
      `);
      db.pragma('foreign_keys=on');
    }
  } catch (e) {
    console.error('Migration error:', e);
  }
};

export { db, initDb };
