// Service-level tests: no HTTP, no Express needed. Run: npm test
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createDiscoveryService } from '../src/services/discoveryService.js';
import { createJsonStore } from '../src/store/jsonStore.js';
import { loadProfiles } from '../src/data/loadProfiles.js';

const profiles = loadProfiles();
const likers = profiles.filter((p) => p.likesMe);
const nonLikers = profiles.filter((p) => !p.likesMe);
let file, service;

const fresh = () => {
  file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'coy-')), 'db.json');
  service = createDiscoveryService({ profiles, store: createJsonStore(file) });
};
beforeEach(fresh);

const code = (fn) => {
  try { fn(); } catch (e) { return `${e.status}:${e.code}`; }
  return 'no-error';
};

test('seed has >= 30 profiles and some already like the user', () => {
  assert.ok(profiles.length >= 30);
  assert.ok(likers.length >= 5);
});

test('feed never exposes likesMe (or any non-public field)', () => {
  const allowed = ['id', 'name', 'age', 'photo', 'bio', 'place', 'interests'];
  for (const p of service.getFeed()) assert.deepEqual(Object.keys(p).sort(), [...allowed].sort());
  assert.ok(!JSON.stringify(service.getFeed()).includes('likesMe'));
});

test('feed order is not correlated with likesMe in the first page', () => {
  const firstTen = service.getFeed().slice(0, 10).map((p) => profiles.find((x) => x.id === p.id).likesMe);
  assert.ok(firstTen.includes(true) && firstTen.includes(false));
});

test('liking someone who liked you creates exactly one match and returns it', () => {
  const r = service.swipe({ profileId: likers[0].id, action: 'like' });
  assert.equal(r.match, true);
  assert.equal(r.profile.id, likers[0].id);
  assert.ok(!('likesMe' in r.profile));
  assert.equal(service.getMatches().length, 1);
});

test('liking someone who has NOT liked you gives no match', () => {
  const r = service.swipe({ profileId: nonLikers[0].id, action: 'like' });
  assert.deepEqual(r, { match: false });
  assert.equal(service.getMatches().length, 0);
});

test('passing on someone who liked you gives no match and no hint', () => {
  const r = service.swipe({ profileId: likers[0].id, action: 'pass' });
  assert.deepEqual(r, { match: false });
  assert.equal(service.getMatches().length, 0);
});

test('swiped profiles disappear from the feed', () => {
  const before = service.getFeed();
  service.swipe({ profileId: before[0].id, action: 'pass' });
  const after = service.getFeed();
  assert.equal(after.length, before.length - 1);
  assert.ok(!after.some((p) => p.id === before[0].id));
});

test('duplicate swipes are rejected with 409 and do not duplicate matches', () => {
  service.swipe({ profileId: likers[0].id, action: 'like' });
  assert.equal(code(() => service.swipe({ profileId: likers[0].id, action: 'like' })), '409:ALREADY_SWIPED');
  assert.equal(code(() => service.swipe({ profileId: likers[0].id, action: 'pass' })), '409:ALREADY_SWIPED');
  assert.equal(service.getMatches().length, 1);
});

test('validation: bad body, bad id, bad action, unknown profile', () => {
  assert.equal(code(() => service.swipe(undefined)), '400:INVALID_BODY');
  assert.equal(code(() => service.swipe(null)), '400:INVALID_BODY');
  assert.equal(code(() => service.swipe([])), '400:INVALID_BODY');
  assert.equal(code(() => service.swipe({ action: 'like' })), '400:INVALID_PROFILE_ID');
  assert.equal(code(() => service.swipe({ profileId: 42, action: 'like' })), '400:INVALID_PROFILE_ID');
  assert.equal(code(() => service.swipe({ profileId: '', action: 'like' })), '400:INVALID_PROFILE_ID');
  assert.equal(code(() => service.swipe({ profileId: 'p01' })), '400:INVALID_ACTION');
  assert.equal(code(() => service.swipe({ profileId: 'p01', action: 'superlike' })), '400:INVALID_ACTION');
  assert.equal(code(() => service.swipe({ profileId: 'nope', action: 'like' })), '404:PROFILE_NOT_FOUND');
  assert.equal(code(() => service.swipe({ profileId: '__proto__', action: 'like' })), '404:PROFILE_NOT_FOUND');
  assert.equal(service.getFeed().length, profiles.length); // nothing was recorded
});

test('swipes and matches persist across a "restart" (new store on the same file)', () => {
  service.swipe({ profileId: likers[0].id, action: 'like' });
  service.swipe({ profileId: nonLikers[0].id, action: 'pass' });
  const restarted = createDiscoveryService({ profiles, store: createJsonStore(file) });
  assert.equal(restarted.getFeed().length, profiles.length - 2);
  assert.equal(restarted.getMatches().length, 1);
  assert.equal(restarted.getMatches()[0].id, likers[0].id);
});

test('matches are newest first and only contain public fields', () => {
  service.swipe({ profileId: likers[0].id, action: 'like' });
  service.swipe({ profileId: likers[1].id, action: 'like' });
  const m = service.getMatches();
  assert.equal(m[0].id, likers[1].id);
  assert.ok(!JSON.stringify(m).includes('likesMe'));
});

test('a failed disk write leaves state unchanged (no half-saved swipe)', () => {
  const dir = path.dirname(file);
  const store = createJsonStore(file);
  const svc = createDiscoveryService({ profiles, store });
  fs.mkdirSync(`${file}.tmp`); // make the temp-file write fail
  assert.throws(() => svc.swipe({ profileId: likers[0].id, action: 'like' }));
  assert.equal(svc.getFeed().length, profiles.length);
  assert.equal(svc.getMatches().length, 0);
  fs.rmSync(`${file}.tmp`, { recursive: true });
  assert.equal(svc.swipe({ profileId: likers[0].id, action: 'like' }).match, true); // recovers
  assert.ok(fs.existsSync(dir));
});

test('a corrupted state file is moved aside and the app starts fresh', () => {
  fs.writeFileSync(file, '{ not json');
  const svc = createDiscoveryService({ profiles, store: createJsonStore(file) });
  assert.equal(svc.getFeed().length, profiles.length);
  assert.ok(fs.readdirSync(path.dirname(file)).some((f) => f.includes('.corrupt-')));
});
