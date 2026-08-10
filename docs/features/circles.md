# features/circles.md

Creating, joining, and switching circles; invite codes; the two sidebars. Load with `api-contract.md`.

## Model

A circle is a name and an invite code. Nothing else — no goals, no description, no settings.

**Every member is equal.** Any member can view and share the invite code. Nobody can remove anyone, rename the circle, or gate anything. `circles.creator_id` exists as an audit column and grants zero extra permission. If you find yourself writing an `isCreator` check, you've misread the spec.

Membership is a join table (`circle_members`), so multi-circle is already possible in the data. The MVP UI still assumes **one active circle at a time** — the sidebar lists all of them and switching swaps the active one.

## Invite codes

Format `XX-XXXXX` — e.g. `F1-8KZQ`. Generate from an unambiguous alphabet: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no `I`, `O`, `0`, `1`).

Generated in `utils/inviteCode.js`. Retry on unique-violation up to 5 times, then throw. Compared **case-insensitively with dashes and spaces stripped**, so `f18kzq` and `F1-8KZQ` both work.

## Screens & components

### Circles sidebar (left, 240px)
`CIRCLES` label in `forest`, then one row per circle: a 32px coloured dot (deterministic from circle id) + name. The active row gets `bg terracottaTint`, `terracottaDark` semibold text, and a 3px `terracotta` left bar. Below the list, a dashed `+ New circle` button.

**Clicking a circle switches the active circle** — it does not navigate. `circleStore.setActive(id)` → feed, members, and leaderboard all refetch off the new id.

### Members sidebar (right, 280px)
`CIRCLE MEMBERS` label, then a row per member: avatar + display name + a `muted` `in <circle name>` subline. Footer in `muted`: `5 members · code F1-8KZQ`, code in mono.

**Clicking a member navigates to `/profile/:userId`.** Clicking the footer copies the invite code and toasts "Invite code copied."

On mobile both sidebars are drawers opened from navbar icons. Selecting anything closes the drawer.

### Join or Create modal
Pill tab toggle, per the mockup.

- **Join** — one input, `Invite code`, placeholder `F1-8KZQ`, mono, auto-uppercased as you type. Primary button `Join circle`. Below: `muted` helper "Ask a friend in the circle for their code."
- **Create** — one input, `Circle name`, placeholder "Friends 1", 1–50 chars. Primary button `Create circle`. Below: `muted` helper "You'll get an invite code to share."

On success: close the modal, add the circle to `circleStore`, **set it active**, refetch the feed. After *creating*, additionally show a success panel with the new code, a Copy button, and "Share this code so friends can join." — the code is the entire point of having created it, so don't bury it in the sidebar footer.

## Server

### `POST /api/circles`
Validate name → generate a unique code → insert `circles` → insert `circle_members` for the creator → return the circle with `memberCount: 1`. The two inserts must both succeed; if the membership insert fails, delete the circle and throw.

### `POST /api/circles/join`
Normalise the code → look up → `404 NOT_FOUND` "No circle found with that code." if absent → if already a member, `409 CONFLICT` "You're already in this circle." → insert membership → return the circle with members.

### `GET /api/circles/:id`
`requireCircleMember` → return circle + member list. Non-members get `403`.

### `requireCircleMember` middleware
Reads `req.params.id` (or `req.body.circleId`, depending on the route), checks `circle_members` for `(circleId, req.user.id)`, throws `403 FORBIDDEN` "You're not a member of this circle." Applied to every circle-scoped route: feed, leaderboard, circle detail, and any write carrying a `circleId`.

Never trust a `circleId` in a request body without this check. It is the single easiest hole in the app.

## Client state

`circleStore`:

```js
{ circles: [],            // [{ id, name, inviteCode, memberCount }]
  activeCircleId: null,
  members: [],            // members of the active circle
  setActive, loadCircles, loadMembers, createCircle, joinCircle }
```

- `activeCircleId` persists to `localStorage` (`trc_active_circle`). On boot, validate it still appears in `circles`; if not, fall back to the first circle.
- Circles arrive from `GET /api/auth/me` on boot — no separate list endpoint needed.
- Every circle-scoped fetch reads `activeCircleId` from the store. Do not pass it down through props.

## Zero-circle state

A brand-new user belongs to no circle. `FeedPage` then renders an `EmptyState` — "You're not in a circle yet" / "Join a friend's circle with their code, or start your own." / primary button `Join or create a circle` — and auto-opens the modal on first mount.

The members sidebar and the leaderboard render their own empty states rather than crashing on a null `activeCircleId`. Guard every circle-scoped fetch with `if (!activeCircleId) return;`.

## Edge cases

| Case | Behaviour |
|---|---|
| Code typed in lowercase / without dash | Accepted — normalise before lookup |
| Already a member | 409, friendly message, modal stays open |
| Circle name is whitespace | 422 inline "Please enter a circle name." |
| Duplicate circle names | Allowed. Names are not unique; codes are. |
| Last member of a circle | Nothing special — no leaving in MVP |
| User in 3+ circles | Sidebar scrolls. Still one active. |

## Out of scope

Leaving a circle · removing members · renaming · regenerating a code · circle avatars/covers · circle goals · any admin capability · viewing a feed across all circles at once.
