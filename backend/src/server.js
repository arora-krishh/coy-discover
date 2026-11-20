import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { createDiscoveryService } from './services/discoveryService.js';
import { createJsonStore } from './store/jsonStore.js';
import { loadProfiles } from './data/loadProfiles.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4000;
const DATA_FILE = process.env.DATA_FILE || path.join(here, '..', 'data', 'db.json');

const service = createDiscoveryService({ profiles: loadProfiles(), store: createJsonStore(DATA_FILE) });
const app = createApp({ service, allowReset: process.env.NODE_ENV !== 'production' });

app.listen(PORT, () => {
  console.log(`Coy Discover API listening on http://localhost:${PORT}`);
  console.log(`State file: ${DATA_FILE}`);
});
