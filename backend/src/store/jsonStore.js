import fs from 'node:fs';
import path from 'node:path';

/**
 * JSON-file persistence for the only mutable state: swipes + matches.
 *
 * Reliability choices:
 *  - Writes go to a temp file, then rename() over the real file. rename is atomic,
 *    so a crash mid-write can never leave a half-written db.json.
 *  - commit() edits a COPY of the state and only swaps it in after the disk write
 *    succeeded. If the write fails, memory and disk still agree.
 *  - A corrupted file is moved aside (not deleted) and we start fresh.
 */
const emptyState = () => ({ swipes: [], matches: [] });

function normalize(raw) {
  return {
    swipes: Array.isArray(raw?.swipes) ? raw.swipes : [],
    matches: Array.isArray(raw?.matches) ? raw.matches : [],
  };
}

export function createJsonStore(filePath) {
  function load() {
    let text;
    try {
      text = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') return emptyState();
      throw err;
    }
    try {
      return normalize(JSON.parse(text));
    } catch {
      const backup = `${filePath}.corrupt-${Date.now()}`;
      fs.renameSync(filePath, backup);
      console.warn(`[store] ${filePath} was not valid JSON. Moved to ${backup}; starting fresh.`);
      return emptyState();
    }
  }

  function persist(next) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(next, null, 2));
    fs.renameSync(tmp, filePath);
  }

  let state = load();

  return {
    /** Read-only view of the current state. Do not mutate it. */
    read: () => state,

    /** Run `mutator` on a copy, save to disk, then adopt the copy. Returns the mutator's result. */
    commit(mutator) {
      const next = structuredClone(state);
      const result = mutator(next);
      persist(next);
      state = next;
      return result;
    },
  };
}
