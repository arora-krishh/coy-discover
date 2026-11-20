import { Router } from 'express';
import { avatarSvg } from '../utils/avatar.js';

/**
 * Thin HTTP layer: parse the request, call the service, send JSON.
 * No business rules live here.
 */
export function createRouter(service, { allowReset = false } = {}) {
  const router = Router();

  // User data must never be cached by browsers/proxies.
  const noStore = (res) => res.set('Cache-Control', 'no-store');

  router.get('/health', (req, res) => res.json({ ok: true }));

  router.get('/feed', (req, res) => {
    noStore(res);
    res.json({ profiles: service.getFeed() });
  });

  router.post('/swipe', (req, res) => {
    noStore(res);
    res.json(service.swipe(req.body));
  });

  router.get('/matches', (req, res) => {
    noStore(res);
    res.json({ matches: service.getMatches() });
  });

  // Generated placeholder photo. Same public fields only, never any like info.
  router.get('/avatars/:file', (req, res) => {
    const id = req.params.file.replace(/\.svg$/, '');
    const profile = service.getPublicProfile(id);
    res.type('image/svg+xml').set('Cache-Control', 'public, max-age=86400').send(avatarSvg(profile));
  });

  // Demo helper: wipe swipes + matches. Disabled when NODE_ENV=production.
  if (allowReset) {
    router.post('/dev/reset', (req, res) => {
      service.reset();
      res.json({ ok: true });
    });
  }

  return router;
}
