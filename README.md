# Coy - Discover tab

A swipe-based discovery tab (Part B of the Coy SDE intern assignment) with a blank Home tab beside it.
React + Vite frontend, Node + Express backend, JSON-file persistence.

## Run it

Needs Node 18+ (Node 20+ recommended).

```bash
npm run install:all     # installs root, backend and frontend deps
npm run dev             # starts API (4000) and web app (5173) together
```

- Web app: http://localhost:5173 (open in a phone-size window or DevTools device mode)
- API: http://localhost:4000 (also reachable as `/api/...`)

Run the parts separately with `npm run dev:backend` and `npm run dev:frontend`. Tests: `npm test`.

## How to demo

1. Swipe right on cards (drag, buttons, or arrow keys). 12 of the 36 profiles already like you; liking one of them shows **It's a match!**
2. Open **Matches** (top-right toggle) to see the list.
3. Reload the page: swipes and matches are still there. At the end you get the empty state with a dev-only **Reset demo data** button.

## API

| Method | Path | Result |
| --- | --- | --- |
| GET | `/feed` | `{ profiles: [...] }` unswiped profiles, public fields only |
| POST | `/swipe` | body `{ profileId, action: "like" \| "pass" }` -> `{ match: false }` or `{ match: true, profile }` |
| GET | `/matches` | `{ matches: [...] }` mutual matches only, newest first |
| POST | `/dev/reset` | demo helper, disabled when `NODE_ENV=production` |

Errors are always `{ error: { code, message } }`: 400 invalid input, 404 unknown profile, 409 already swiped.

Try it:

```bash
curl localhost:4000/feed | head -c 300
curl -X POST localhost:4000/swipe -H 'Content-Type: application/json' -d '{"profileId":"p01","action":"like"}'
curl localhost:4000/matches
curl -X POST localhost:4000/swipe -H 'Content-Type: application/json' -d '{"profileId":"p01","action":"like"}'   # 409
curl -X POST localhost:4000/swipe -H 'Content-Type: application/json' -d '{"profileId":"p01","action":"love"}'    # 400
```

## Structure

```
backend/src/services/discoveryService.js   all business rules (privacy, matching, validation)
backend/src/store/jsonStore.js             atomic JSON persistence (data/db.json)
backend/src/routes + app.js + server.js    thin HTTP layer
backend/src/data/profiles.json             36 seed profiles (internal likesMe flag)
frontend/src/api.js                        the only place that calls fetch
frontend/src/components/                   Discover, SwipeCard, MatchOverlay, MatchesView, ...
```


