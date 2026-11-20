import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export function loadProfiles(file = path.join(here, 'profiles.json')) {
  const profiles = JSON.parse(fs.readFileSync(file, 'utf8'));
  const ids = new Set(profiles.map((p) => p.id));
  if (ids.size !== profiles.length) throw new Error('profiles.json contains duplicate ids');
  return profiles;
}
