import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

let cachedDb = null;

export function getDb() {
  if (cachedDb) return cachedDb;

  try {
    const isVercel = Boolean(process.env.VERCEL);
    const dbDir = isVercel ? '/tmp' : path.resolve(process.cwd(), 'work');
    mkdirSync(dbDir, { recursive: true });
    const sqlitePath = path.join(dbDir, 'atlas.sqlite');
    const sqlite = new DatabaseSync(sqlitePath);

    sqlite.exec('CREATE TABLE IF NOT EXISTS atlas_local_migrations(name TEXT PRIMARY KEY)');

    const drizzleDir = path.resolve(process.cwd(), 'drizzle');
    if (existsSync(drizzleDir)) {
      const sqlFiles = readdirSync(drizzleDir).filter(n => n.endsWith('.sql')).sort();
      for (const name of sqlFiles) {
        const row = sqlite.prepare('SELECT name FROM atlas_local_migrations WHERE name=?').get(name);
        if (!row) {
          const sql = readFileSync(path.join(drizzleDir, name), 'utf8');
          sqlite.exec(sql);
          sqlite.prepare('INSERT INTO atlas_local_migrations(name) VALUES(?)').run(name);
        }
      }
    }

    const wrap = (sql, args = []) => ({
      bind: (...values) => wrap(sql, values),
      first: async () => sqlite.prepare(sql).get(...args) ?? null,
      all: async () => ({ results: sqlite.prepare(sql).all(...args) }),
      run: async () => {
        const r = sqlite.prepare(sql).run(...args);
        return { success: true, meta: { changes: Number(r.changes) } };
      }
    });

    cachedDb = {
      prepare: wrap,
      batch: async statements => {
        sqlite.exec('BEGIN');
        try {
          const res = [];
          for (const s of statements) res.push(await s.run());
          sqlite.exec('COMMIT');
          return res;
        } catch (e) {
          sqlite.exec('ROLLBACK');
          throw e;
        }
      }
    };
  } catch (err) {
    console.warn('[Black Cinema Atlas] SQLite initialization warning; using resilient memory store:', err.message);
    const memoryPrefs = new Map();
    const memoryGroups = new Map();
    const memoryVotes = new Map();
    const memoryMessages = [];

    cachedDb = {
      prepare: (sql, args = []) => {
        const normalized = sql.trim().toUpperCase();
        return {
          bind: (...values) => cachedDb.prepare(sql, values),
          first: async () => {
            if (normalized.includes('FROM PREFERENCES WHERE USER_ID=')) {
              return memoryPrefs.get(args[0]) ? { data: memoryPrefs.get(args[0]) } : null;
            }
            if (normalized.includes('FROM GROUPS WHERE ID=')) {
              return memoryGroups.get(args[0]) ?? null;
            }
            return null;
          },
          all: async () => {
            if (normalized.includes('FROM MESSAGES WHERE USER_ID=')) {
              const userMsgs = memoryMessages.filter(m => m.user_id === args[0]);
              return { results: userMsgs.slice(-20) };
            }
            if (normalized.includes('FROM VOTES WHERE GROUP_ID=')) {
              const groupVotes = memoryVotes.get(args[0]) ?? new Map();
              const results = [];
              for (const [film_id, count] of groupVotes.entries()) {
                results.push({ film_id, count });
              }
              return { results };
            }
            return { results: [] };
          },
          run: async () => {
            if (normalized.includes('INTO PREFERENCES')) {
              memoryPrefs.set(args[0], args[1]);
            } else if (normalized.includes('INTO GROUPS')) {
              memoryGroups.set(args[0], { id: args[0], owner_id: args[1], name: args[2], criteria: args[3], created_at: args[4] });
            } else if (normalized.includes('INTO VOTES')) {
              const gId = args[0], uId = args[1], fId = args[2];
              if (!memoryVotes.has(gId)) memoryVotes.set(gId, new Map());
              const gMap = memoryVotes.get(gId);
              gMap.set(fId, (gMap.get(fId) || 0) + 1);
            } else if (normalized.includes('INTO MESSAGES')) {
              memoryMessages.push({ id: args[0], user_id: args[1], role: args[2], content: args[3], created_at: args[4] });
            }
            return { success: true, meta: { changes: 1 } };
          }
        };
      },
      batch: async statements => {
        const results = [];
        for (const s of statements) results.push(await s.run());
        return results;
      }
    };
  }

  return cachedDb;
}
