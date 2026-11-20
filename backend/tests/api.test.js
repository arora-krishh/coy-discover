// HTTP-level tests against the real Express app on an ephemeral port. Needs `npm install` first.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { createDiscoveryService } from '../src/services/discoveryService.js';
import { createJsonStore } from '../src/store/jsonStore.js';
import { loadProfiles } from '../src/data/loadProfiles.js';

const profiles = loadProfiles();
const liker = profiles.find((p) => p.likesMe);
const nonLiker = profiles.find((p) => !p.likesMe);
let server, base;

before(async () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'coy-api-')), 'db.json');
  const service = createDiscoveryService({ profiles, store: createJsonStore(file) });
  server = createApp({ service, allowReset: true }).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const post = (url, body, raw = false) =>
  fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw ? body : JSON.stringify(body) });

test('GET /feed returns all profiles, without likesMe', async () => {
  const res = await fetch(`${base}/feed`);
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(!text.includes('likesMe'));
  assert.equal(JSON.parse(text).profiles.length, profiles.length);
});

test('POST /swipe: non-mutual like -> 200 { match: false }', async () => {
  const res = await post('/api/swipe', { profileId: nonLiker.id, action: 'like' });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { match: false });
});

test('POST /swipe: mutual like -> 200 { match: true, profile }', async () => {
  const res = await post('/api/swipe', { profileId: liker.id, action: 'like' });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.match, true);
  assert.equal(body.profile.id, liker.id);
});

test('GET /matches lists only the mutual match', async () => {
  const body = await (await fetch(`${base}/api/matches`)).json();
  assert.deepEqual(body.matches.map((m) => m.id), [liker.id]);
});

test('duplicate swipe -> 409', async () => {
  const res = await post('/swipe', { profileId: liker.id, action: 'like' });
  assert.equal(res.status, 409);
  assert.equal((await res.json()).error.code, 'ALREADY_SWIPED');
});

test('invalid inputs -> 400/404 with a JSON error', async () => {
  assert.equal((await post('/swipe', { profileId: 'p01', action: 'love' })).status, 400);
  assert.equal((await post('/swipe', { action: 'like' })).status, 400);
  assert.equal((await post('/swipe', { profileId: 'zzz', action: 'like' })).status, 404);
  assert.equal((await post('/swipe', '{ broken', true)).status, 400);
  assert.equal((await fetch(`${base}/nope`)).status, 404);
});

test('swiped profiles are gone from /feed', async () => {
  const ids = (await (await fetch(`${base}/feed`)).json()).profiles.map((p) => p.id);
  assert.ok(!ids.includes(liker.id) && !ids.includes(nonLiker.id));
});

test('avatars are served as SVG', async () => {
  const res = await fetch(`${base}/api/avatars/p01.svg`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /image\/svg\+xml/);
  assert.equal((await fetch(`${base}/api/avatars/zzz.svg`)).status, 404);
});
