# deployment.md

Shipping the three pieces. Deploy on **day 4**, not day 5 — first deploys always surface something.

```
client  → Vercel      (static Vite build)
server  → Render      (Node web service)
data    → Supabase    (Postgres + Storage, already live)
```

## Order

Supabase is already up. Deploy the **server first** — the client needs its URL at build time, because Vite inlines `VITE_*` at build, not at runtime. Getting this backwards means two rebuilds.

## Server → Render

New → Web Service → connect the repo.

| Setting | Value |
|---|---|
| Root directory | `server` |
| Build command | `npm install` |
| Start command | `npm start` |
| Instance type | Free |

Environment variables — everything from `environment.md`'s server list, plus:

```
NODE_ENV=production
CLIENT_URL=https://<your-app>.vercel.app     # set after the client deploys, then redeploy
PORT                                          # Render injects this; don't hardcode 4000
```

`index.js` must bind to `process.env.PORT` and to `0.0.0.0`, or Render's health check fails:

```js
app.listen(env.PORT, '0.0.0.0', () => console.log(`listening on ${env.PORT}`));
```

**Free tier sleeps after 15 minutes of inactivity** and takes ~50 seconds to wake. Before the demo, hit the API once to warm it. Add a trivial `GET /api/health` returning `{ ok: true }` for exactly this.

## Client → Vercel

New Project → import the repo.

| Setting | Value |
|---|---|
| Root directory | `client` |
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

Environment variable:

```
VITE_API_URL=https://<your-service>.onrender.com/api
```

Changing this requires a **redeploy** — Vite bakes it into the bundle.

### SPA rewrite — required

Without this, a refresh on `/leaderboard` returns a 404 from Vercel. Add `client/vercel.json`:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Test it by loading a deep link directly, not by clicking through from the home page.

## Closing the CORS loop

1. Server deploys, gets a Render URL.
2. Client deploys with `VITE_API_URL` pointing at it.
3. **Go back to Render**, set `CLIENT_URL` to the Vercel URL, redeploy.

CORS allows exactly that origin. Never `*` — the app sends an `Authorization` header. Watch for a trailing slash mismatch; it's the most common cause of "works locally, CORS error in production".

## Supabase in production

Same project as development. A 5-day build doesn't need separate environments, and a second project doubles the setup with no benefit.

Confirm before the demo:

- [ ] `001_init.sql` applied
- [ ] `book-scans` bucket exists and is public
- [ ] Seed data loaded (`database.md`)
- [ ] The service-role key in Render matches the project

## Post-deploy checklist

- [ ] `GET /api/health` responds
- [ ] Register a fresh account on the deployed URL
- [ ] Log in, refresh a deep link (`/leaderboard`) — no 404, still logged in
- [ ] Create a circle, join it from a second browser profile
- [ ] Add a book manually, then by search, then **by scanning a photo from a phone**
- [ ] Finish a book, complete the interview, see the article in the feed
- [ ] Like and comment from the second account
- [ ] Leaderboard shows non-trivial numbers in both periods
- [ ] Open the deployed site on a real phone — the scan flow especially
- [ ] Check the browser console: no CORS errors, no mixed-content warnings on cover images (`books-api.md` → https rewrite)

## Failure table

| Symptom | Cause |
|---|---|
| CORS error in production only | `CLIENT_URL` mismatch (trailing slash, `www`, `http` vs `https`) |
| 404 on refresh of any route but `/` | Missing `vercel.json` rewrite |
| Client calls `localhost:4000` in production | `VITE_API_URL` set after the build — redeploy |
| First request takes ~50s | Render free tier cold start — warm it before demoing |
| Cover images blank in production | `http://` Google URLs blocked as mixed content |
| Scan works locally, 500s in production | Bucket missing, or service-role key not set on Render |
| Server crashes on boot | `env.js` validation caught a missing variable — read the log, it names the key |

## Security before you ship

- [ ] No `.env` committed anywhere in git history
- [ ] `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` exist only in Render's env
- [ ] The client bundle contains **no** Supabase or Gemini key — search `dist/` for `service_role` and `AIza` to be sure
- [ ] `JWT_SECRET` in production differs from the local one
- [ ] `errorHandler` sends no stack traces when `NODE_ENV=production`

## README (write it on day 5)

Short and real: one-paragraph description, screenshots of the feed and an AI-generated review, the live URLs, the stack, local setup (clone → both `.env`s → migration → `npm i` and `npm run dev` in each folder), and a one-line note on the architecture. Link `docs/INDEX.md` for anything deeper.
