# features/auth.md

Google sign-in, session handling, route protection. Load with `api-contract.md`.

## Scope

**Google only, via Supabase Auth.** No email/password, no other providers, no password reset (there is no password to reset).

Supabase Auth owns the identity/session layer end to end: the client calls `supabase.auth.signInWithOAuth` directly, Supabase handles the OAuth exchange with Google, and the resulting session (including a short-lived access token) is held client-side by the Supabase JS client. **Express issues no tokens of its own.** Every protected route validates the Supabase-issued access token by calling `supabase.auth.getUser(token)` server-side.

This is a deliberate departure from a hand-rolled email/password JWT design — see `CLAUDE.md`'s non-negotiables for the current statement of it. The upside: no password storage, no bcrypt, no reset flow to build. The tradeoff: Express's own "build the auth" deliverable narrows to *validating* a third-party session rather than *issuing* one — see the security checklist below for what still has to be correct on our side.

## Screens

### Welcome — `/`, Auth — `/auth`

Both routes render `AuthPage`: the split panel from the mockup — terracotta branding panel (wordmark, stacked-books illustration, serif headline, pull-quote) on the left, a single **Continue with Google** button on the right. There is no login/register tab toggle and no form — Google's own account picker is the only credential UI. Redirects to `/feed` if already authenticated.

`WelcomePage` (marketing splash with "Get Started" / "Log in" CTAs) exists in the codebase but is not currently routed. Wiring it back in as a true `/` landing page ahead of `/auth` is a small follow-up, not a blocker.

## Client flow

1. User clicks **Continue with Google** → `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '<origin>/feed' } })`. This is a real page navigation to Google's consent screen and back — not a background fetch.
2. Google redirects back through Supabase, which sets the session and lands the browser on `redirectTo`.
3. `authStore.initializeAuth()` (called once from `main.jsx` on boot) picks the session up two ways:
   - `supabase.auth.getSession()` for the state that exists at load time.
   - `supabase.auth.onAuthStateChange(...)` for everything after — login, logout, and silent token refresh.
   Both paths set `{ user, token, status: 'ready' }` and mirror `session.access_token` into `localStorage['trc_token']`.
4. `logout()` calls `supabase.auth.signOut()`; the `onAuthStateChange` listener fires, clears `user`/`token`, and the store's `localStorage` mirror is cleared with it.

The client never calls `/api/auth/login` or `/api/auth/register` — those routes don't exist. `api/client.js` attaches whatever token is in `localStorage['trc_token']` as `Authorization: Bearer <token>` to every `/api/*` call, same as before.

## Server flow

### `requireAuth` middleware

```
read Authorization header
  → missing or not "Bearer x"        → 401 UNAUTHENTICATED "You need to be signed in."
  → supabase.auth.getUser(token) fails → 401 UNAUTHENTICATED "Your session has expired. Please sign in again."
  → ok                               → req.user = { id: supabaseUser.id, email: supabaseUser.email }; next()
```

`getUser` is a live call to Supabase's Auth API — it validates the token remotely rather than verifying a local secret, so there's no `JWT_SECRET` on our side anymore. `requireAuth` is applied per-router; nothing needs to stay open the way `/register` and `/login` used to, since sign-in never touches our API.

### User provisioning — the part that needs care

Supabase Auth's own `auth.users` table is not `public.users`. The first time a Google-authenticated request reaches Express, there must be a row in **our** `users` table keyed by that same `id`, or every route that joins on `users` (feed, circles, leaderboard) breaks for a brand-new sign-in.

Provision lazily, in the auth flow, not with a database trigger (consistent with this codebase's "no trigger, keep it simple" rule elsewhere — see `database.md`):

- `GET /api/auth/me` — before reading the row, upsert it: `id` = `req.user.id`, `email` = the Supabase user's email, `display_name` = `user_metadata.full_name` (fall back to the email's local part), `avatar_url` = `user_metadata.avatar_url`. Match on `id`, so a repeat sign-in is a no-op update, not a duplicate.

This upsert-in-`getMe` step is **not yet implemented** — today `getMe` does a plain `findById` against `public.users`, which 404s for anyone who has never hit `/me` before. Flagging it here per `CLAUDE.md`'s "known gaps" convention; treat it as the next piece of server work, not a documentation nicety.

### `GET /api/auth/me`

Unchanged contract from the client's point of view — see `api-contract.md`. Returns the (now-provisioned) user plus their circles. Called once on boot to rehydrate.

## Client `authStore`

Actual shape in the codebase — see `client-architecture.md` for the full store contract:

```js
{ user: null, token: null, status: 'idle' | 'loading' | 'ready',
  initializeAuth(), logout() }
```

No `login`/`register` actions — there's nothing for them to do; sign-in is the redirect in step 1 above, kicked off directly from `AuthPage`.

### `ProtectedRoute`

```
status !== 'ready'  → full-page loader (never a redirect — this is the flash-of-login bug)
user === null       → <Navigate to="/auth" replace />
else                → <Outlet />
```

### Global 401 handling

`api/client.js` calls `authStore` logout state on any 401 and shows a toast: "Your session expired. Please sign in again." One place, not per-call.

### After a successful auth

Lands on `/feed` (set via `signInWithOAuth`'s `redirectTo`). If the user has zero circles, `FeedPage` shows the join-or-create empty state — a brand-new user should land somewhere actionable, not on an empty screen.

## Security checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` never reaches the client — only `SUPABASE_ANON_KEY` is exposed, and only for the Auth calls
- [ ] `requireAuth` calls `supabase.auth.getUser`, not a local `jwt.verify` — there is no shared secret to keep in sync
- [ ] Every `public.users` row is provisioned server-side (see above) — never trust `user_metadata` fields the client could have sent unvalidated for anything authorization-relevant
- [ ] CORS allows exactly `CLIENT_URL`, never `*`
- [ ] `express.json({ limit: '1mb' })` caps body size
- [ ] Google OAuth redirect URLs are registered in the Supabase Auth dashboard for every environment (localhost + production) — see `environment.md`

## Out of scope

Email/password login · password reset · email verification · non-Google providers · refresh-token handling on our side (Supabase's client SDK does this for us) · rate limiting on auth endpoints · avatar upload (Google's `picture` claim is the avatar).
