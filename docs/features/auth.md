# features/auth.md

Register, login, JWT, route protection. Load with `api-contract.md`.

## Scope

Email + password only. No OAuth, no email verification, no password reset (the "Forgot password?" link in the mockup is decorative — render it, wire it to nothing, or omit it).

**We do not use Supabase Auth.** The course requires Express-side authentication and authorization as a deliverable. Hand-rolled JWT against our own `users` table.

## Screens

### Welcome — `/`
Wordmark, tagline, three short pitch items (Snap / Track / Compete), `Get Started` (primary → `/auth?mode=register`) and `Log in` (ghost → `/auth?mode=login`). Serif hero headline. Redirects to `/feed` if already authenticated.

### Auth — `/auth`
Split panel, per the mockup:

- **Left panel** — `bg terracotta`, wordmark in `surface`, the stacked-books illustration, serif headline "A cosy corner for you and your reading circle.", subline, and a `line`-divided italic pull-quote at the bottom. Hidden below 768px.
- **Right panel** — `bg surface`. Pill tab toggle (`Log in` / `Create account`) at the top, then the form. `h1` greeting ("Welcome back" / "Create your account") and a `muted` subline. Below the submit button: an `or` divider and a link to the other mode.

Whole card: radius 24, shadow `lg`, max-width 1040, split 45/55.

Tab state lives in the URL (`?mode=login|register`) so the "Create an account" link is a real navigation and the back button works.

## Forms

**Login:** email, password → `Log in`.
**Register:** display name, email, password, confirm password → `Create account`.

Validation, identical rules client and server (Zod on both sides):

| Field | Rule | Message |
|---|---|---|
| displayName | trimmed, 2–50 | "Please enter your name." |
| email | valid email, lowercased before storing | "Please enter a valid email address." |
| password | ≥8 chars | "Password must be at least 8 characters." |
| confirmPassword | equals password | "Passwords don't match." |

Client-side validation runs on blur and on submit. Server-side runs regardless — the client check is UX, not security.

All errors render **inline** under their field. The one exception is a failed login, which is a form-level message above the submit button: **"Email or password is incorrect."** — used for both wrong email and wrong password, so the form never reveals whether an account exists.

## Server

### Register — `POST /api/auth/register`
1. Validate.
2. `lower(email)` lookup → if found, `409 CONFLICT` "That email is already registered."
3. `bcrypt.hash(password, env.BCRYPT_ROUNDS)`.
4. Insert `users`.
5. Sign a JWT.
6. `201` with `{ token, user }`.

`confirmPassword` is validated then discarded — it never reaches the model.

### Login — `POST /api/auth/login`
1. Validate.
2. Find by lowercased email.
3. **Always run `bcrypt.compare`**, even when no user was found (compare against a dummy hash), so response timing doesn't leak account existence.
4. On mismatch → `401 UNAUTHENTICATED`, the shared message.
5. Sign a JWT, return `{ token, user }`.

### Me — `GET /api/auth/me`
Returns the user plus their circles with member counts. Called once on boot to rehydrate.

### Token

```js
jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN }); // 7d
```

Keep the payload to `sub` and `email`. Never put a display name or anything mutable in it — the token outlives the value.

### `requireAuth` middleware

```
read Authorization header
  → missing or not "Bearer x"     → 401 UNAUTHENTICATED "You need to be signed in."
  → jwt.verify throws             → 401 UNAUTHENTICATED "Your session has expired. Please sign in again."
  → ok                            → req.user = { id: payload.sub, email: payload.email }; next()
```

It does **not** hit the database. If a user is deleted, their token stays valid until expiry — acceptable for this build, since nothing deletes users.

`requireAuth` is applied per-router, not globally, because `/api/auth/register` and `/api/auth/login` must stay open.

## Client

### `authStore`

```js
{ user: null, token: null, status: 'idle' | 'loading' | 'ready',
  login, register, logout, hydrate }
```

- Token persists in `localStorage` under `trc_token`.
- `hydrate()` runs once in `main.jsx`. No token → `status: 'ready'`, `user: null`. Token → `GET /api/auth/me`; on success set user and circles, on 401 clear the token. **Always** end at `status: 'ready'`.
- `logout()` clears the token, resets `circleStore`, navigates to `/`.

### `ProtectedRoute`

```
status !== 'ready'  → full-page skeleton (never a redirect — this is the flash-of-login bug)
user === null       → <Navigate to="/auth" replace />
else                → <Outlet />
```

### Global 401 handling
`api/client.js` calls `authStore.logout()` on any 401 and shows a toast: "Your session expired. Please sign in again." One place, not per-call.

### After a successful auth
Navigate to `/feed`. If the user has zero circles, `FeedPage` shows the join-or-create empty state and auto-opens `JoinCreateCircleModal` — a brand-new user should land somewhere actionable, not on an empty screen.

## Security checklist

- [ ] `password_hash` never appears in any API response — strip it in the model, not the controller
- [ ] `JWT_SECRET` is ≥32 chars and lives only in env
- [ ] Login response is identical for wrong-email and wrong-password
- [ ] bcrypt runs on both branches of login (timing)
- [ ] Emails stored and compared lowercased
- [ ] `express.json({ limit: '1mb' })` caps body size
- [ ] CORS allows exactly `CLIENT_URL`, never `*`

## Out of scope

Password reset · email verification · OAuth · refresh tokens · rate limiting on login (mention it as a known gap in the demo rather than building it) · avatar upload (avatars are generated initials, see `design/ui-patterns.md`).
