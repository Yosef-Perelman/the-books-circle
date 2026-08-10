# client-architecture.md

Routing, state, data fetching, and error surfacing on the React side. Load whenever you build or change a screen.

## Routes

Pages are routes. **Modals are not routes** — they're overlay state.

| Path | Component | Guard |
|---|---|---|
| `/` | `WelcomePage` | public; redirect to `/feed` if authed |
| `/auth` | `AuthPage` (tab: login \| register) | public; redirect to `/feed` if authed |
| `/feed` | `FeedPage` | protected |
| `/profile/:userId` | `ProfilePage` | protected |
| `/leaderboard` | `LeaderboardPage` | protected |
| `*` | `NotFoundPage` | — |

`/profile/me` is not a route. Link to `/profile/${currentUser.id}`; the page derives `isOwnProfile` from the param.

```jsx
<Route element={<ProtectedRoute />}>
  <Route element={<AppShell />}>
    <Route path="/feed" element={<FeedPage />} />
    <Route path="/profile/:userId" element={<ProfilePage />} />
    <Route path="/leaderboard" element={<LeaderboardPage />} />
  </Route>
</Route>
```

`ProtectedRoute` renders a full-page loader while auth is rehydrating, then either `<Outlet/>` or `<Navigate to="/auth" replace />`. Never flash the login screen at an authenticated user.

## Modals (overlay state, in `uiStore`)

`AddBookModal` · `InterviewModal` · `JoinCreateCircleModal` · `ConfirmReadingDialog` · `CommentsDrawer`

```js
// uiStore
{ modal: null | { type: 'addBook' | 'interview' | 'joinCircle' | 'confirmReading', props: {} },
  openModal: (type, props) => ...,
  closeModal: () => ... }
```

One modal at a time. Opening a second replaces the first. Exception: `InterviewModal` may open directly from `AddBookModal`'s flow — that's a replace, not a stack.

## Stores (Zustand)

Three stores, no more. Server data that isn't shared across pages lives in component state.

### `authStore`
```js
{ user: null, token: null, status: 'idle'|'loading'|'ready',
  initializeAuth(), logout() }
```
- No `login`/`register` actions — sign-in is `supabase.auth.signInWithOAuth({ provider: 'google' })`, called directly from `AuthPage`, not through the store.
- `initializeAuth()` runs once in `main.jsx`: reads `supabase.auth.getSession()` for the initial state, then subscribes via `supabase.auth.onAuthStateChange` to stay in sync across login, logout, and silent token refresh. Both paths always resolve to `status: 'ready'` and mirror `session.access_token` into `localStorage` under `trc_token` (this is the real app, not a Claude artifact — `localStorage` is fine here).
- `logout()` calls `supabase.auth.signOut()`; the change listener clears `user`/`token` and the `localStorage` mirror. See `features/auth.md` for the full flow.

### `circleStore`
```js
{ circles: [], activeCircleId: null, members: [],
  setActive(id), loadCircles(), createCircle(name), joinCircle(code) }
```
- `activeCircleId` persisted to `localStorage` under `trc_active_circle`; falls back to the first circle.
- Every circle-scoped fetch reads `activeCircleId` from here. Do not thread it through props.
- If a user belongs to zero circles, `FeedPage` renders the "join or create a circle" empty state instead of the feed.

### `uiStore`
Modal state and toast helpers only. No server data.

Feed posts, shelves, and leaderboard results are **page-local state**, not global. They refetch on mount. This is a 5-day build; a cache layer isn't worth it.

## API client

`src/api/client.js` is the only place `fetch` appears.

```js
import { useAuthStore } from '../stores/authStore';

const BASE = import.meta.env.VITE_API_URL;

export async function request(path, { method = 'GET', body, isForm } = {}) {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(body && !isForm && { 'Content-Type': 'application/json' }),
    },
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) useAuthStore.getState().logout();
    throw new ApiClientError(json.error ?? {
      code: 'NETWORK', message: 'Cannot reach the server. Check your connection.',
    });
  }
  return json.data;
}
```

`ApiClientError` carries `code`, `message`, and `details`. Resource modules (`api/circles.js` etc.) are thin named functions over `request` — they add no logic.

## Error surfacing — the requirement, made concrete

Three channels, and every failure uses exactly one:

| Failure | Channel |
|---|---|
| Field-level validation (422 `details`, or client-side) | **Inline** under the input, via Mantine's `error` prop |
| Action failed (like, add book, post review, join circle) | **Toast** via `@mantine/notifications`, red, 5s |
| Page-level load failed | **`<ErrorBanner>`** in place of content, with a Retry button |

```js
// standard mutation shape
try {
  setSubmitting(true);
  await api.userBooks.create(payload);
  notifications.show({ color: 'green', message: 'Added to your shelf.' });
  closeModal();
} catch (err) {
  if (err.details) setFieldErrors(err.details);        // inline
  else notifications.show({ color: 'red', message: err.message });  // toast
} finally {
  setSubmitting(false);
}
```

Rules:
- Never `console.log` an error and show nothing.
- Never show a raw error code to the user — `err.message` from the server is already human-readable.
- Disable the submit button while `submitting` is true, and show a Mantine loader in it.
- An empty list is not an error. Use `<EmptyState>` with a helpful next action.

## Optimistic updates

Only for **likes** — the interaction is too frequent to await. Flip `likedByMe` and `likeCount` immediately, revert and toast on failure. Everything else awaits the server.

## Loading states

- Page load → Mantine `<Skeleton>` matching the real layout (3 skeleton post cards, 4 skeleton leaderboard cards). Not a centered spinner.
- Button action → `loading` prop on the Mantine button.
- The scan upload can take 3–6s → show explicit progress copy ("Reading the cover…"), not just a spinner.

## Responsive strategy

Breakpoint `sm = 768px`. See `design/ui-patterns.md` for the full layout spec.

- **Desktop** — 3 columns: circles sidebar (240px) · feed (flex, max 680px) · members sidebar (280px).
- **Mobile** — single column. Both sidebars become Mantine `<Drawer>`s opened from navbar icons. Modals become full-screen (`fullScreen` prop below `sm`).

Use `useMediaQuery('(min-width: 768px)')` from `@mantine/hooks` for structural changes; use Mantine responsive props for everything cosmetic.

## Shared components worth building first

| Component | Notes |
|---|---|
| `AppShell` | navbar + responsive 3-column grid + drawer triggers |
| `StatusPills` | `{ value, onChange, readOnly }` — the `readOnly` prop is the whole other-profile rule |
| `BookCover` | renders `coverUrl`, falls back to a coloured tile with the title's initials |
| `StarRating` | `{ value, readOnly }`, half-star support, terracotta stars |
| `Avatar` | initial letter on a palette colour picked deterministically from the user id |
| `EmptyState` | icon + line + optional action button |
| `ErrorBanner` | message + Retry |

`BookCover`'s fallback matters — Google Books returns no cover for plenty of titles, and the mockups lean on coloured tiles.
