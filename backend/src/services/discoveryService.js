import { badRequest, notFound, conflict } from '../utils/errors.js';
import { hash } from '../utils/hash.js';

export const ACTIONS = Object.freeze(['like', 'pass']);

/**
 * PRIVACY BOUNDARY.
 * Everything sent to the client goes through this allow-list. `likesMe` is not on it,
 * so it cannot leak by accident if someone adds a new internal field to the seed data.
 */
const toPublic = (p) => ({
  id: p.id,
  name: p.name,
  age: p.age,
  photo: p.photo,
  bio: p.bio,
  place: p.place,
  interests: p.interests,
});

/**
 * Stable pseudo-random order. If the feed were in seed order, or sorted by anything
 * related to likesMe, the ORDER itself would hint at who already likes you.
 */
const feedOrder = (p) => hash(`feed:${p.id}`);

export function createDiscoveryService({ profiles, store }) {
  const byId = new Map(profiles.map((p) => [p.id, p]));

  function getFeed() {
    const swiped = new Set(store.read().swipes.map((s) => s.profileId));
    return profiles
      .filter((p) => !swiped.has(p.id))
      .sort((a, b) => feedOrder(a) - feedOrder(b))
      .map(toPublic);
  }

  function swipe(body) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw badRequest('INVALID_BODY', 'Request body must be a JSON object with profileId and action.');
    }
    const { profileId, action } = body;
    if (typeof profileId !== 'string' || profileId.trim() === '') {
      throw badRequest('INVALID_PROFILE_ID', 'profileId must be a non-empty string.');
    }
    if (!ACTIONS.includes(action)) {
      throw badRequest('INVALID_ACTION', `action must be one of: ${ACTIONS.join(', ')}.`);
    }
    const profile = byId.get(profileId);
    if (!profile) throw notFound('PROFILE_NOT_FOUND', `No profile with id "${profileId}".`);

    // Everything below happens inside ONE commit: the swipe and the match are saved together
    // or not at all. Throwing here (409) leaves state untouched.
    const matched = store.commit((state) => {
      if (state.swipes.some((s) => s.profileId === profileId)) {
        throw conflict('ALREADY_SWIPED', 'You have already swiped on this profile.');
      }
      const now = new Date().toISOString();
      state.swipes.push({ profileId, action, at: now });

      // The match rule: BOTH sides must have liked. The user just liked (action) and the
      // profile's earlier like is `likesMe`.
      const isMutual = action === 'like' && profile.likesMe === true;
      if (isMutual && !state.matches.some((m) => m.profileId === profileId)) {
        state.matches.push({ profileId, matchedAt: now });
        return true;
      }
      return false;
    });

    // A plain like/pass returns { match: false } - identical whether or not they liked you,
    // so a "no match" response reveals nothing.
    return matched ? { match: true, profile: toPublic(profile) } : { match: false };
  }

  function getMatches() {
    // Matches are appended in the order they happen, so reversing gives newest first.
    // (Sorting by timestamp would tie when two matches land in the same millisecond.)
    return [...store.read().matches]
      .reverse()
      .map((m) => ({ ...toPublic(byId.get(m.profileId)), matchedAt: m.matchedAt }));
  }

  function getPublicProfile(id) {
    const profile = byId.get(id);
    if (!profile) throw notFound('PROFILE_NOT_FOUND', `No profile with id "${id}".`);
    return toPublic(profile);
  }

  function reset() {
    store.commit((state) => {
      state.swipes = [];
      state.matches = [];
    });
  }

  return { getFeed, swipe, getMatches, getPublicProfile, reset };
}
