# docs/INDEX.md — Router

**This is the only doc you read first. Then load 1–3 files from below and nothing else.**

Every doc is self-contained enough to work from alone. If a doc tells you to load another, load it. Otherwise don't.

---

## Load by task

| If the task is about… | Load these |
|---|---|
| Setting up the repo from scratch | `architecture.md` → `environment.md` → `conventions.md` |
| Anything touching the database schema | `database.md` |
| Adding or changing an API route | `api-contract.md` + the feature doc |
| Register / login / JWT / password / "who am I" | `features/auth.md` |
| Creating, joining, switching circles; invite codes; members sidebar | `features/circles.md` |
| The home feed, posts, likes, comments, composer | `features/feed.md` |
| Add-a-Book modal: snap / search / manual | `features/add-book.md` |
| Want-to-read / Reading / Finished pills, confirm dialog, ownership | `features/book-status.md` |
| The Finished-book AI interview and generated review article | `features/ai-interview.md` |
| Profile page, tabs, book rows, viewing other members | `features/profile.md` |
| Leaderboard, ranked categories, monthly vs all-time | `features/leaderboard.md` |
| Calling Gemini (vision or text), prompts, retries | `integrations/ai-gemini.md` |
| Google Books search / metadata lookup | `integrations/books-api.md` |
| Uploading scan photos to Supabase Storage | `integrations/storage.md` |
| Colors, hex values, Mantine theme | `design/colors.md` |
| Fonts, sizes, weights, the serif/sans split | `design/fonts.md` |
| Layout, spacing, radii, shadows, buttons, cards, modals, responsive | `design/ui-patterns.md` |
| Routing, state stores, API client, error/toast handling on the client | `client-architecture.md` |
| Folder layout, naming, error middleware, MVC rules | `conventions.md` |
| Env vars, local setup, Supabase project setup | `environment.md` |
| Shipping to Vercel / Render | `deployment.md` |
| "What do we build next?" | `build-order.md` |

---

## Common combos

- **Building any new screen** → `design/ui-patterns.md` + `client-architecture.md` + the feature doc
- **Building any new endpoint** → `api-contract.md` + `database.md` + the feature doc
- **Anything AI** → `integrations/ai-gemini.md` + the feature doc (`add-book.md` or `ai-interview.md`)

---

## Full file list

```
CLAUDE.md                      Agent rules, stack, constraints. Always in context.
docs/
  INDEX.md                     This router.
  architecture.md              System shape, folder tree, dependency list, data flow.
  database.md                  Full schema, indexes, constraints, seed strategy.
  api-contract.md              Every route, request/response shape, error format.
  client-architecture.md       Routes, Zustand stores, API client, error surfacing.
  conventions.md               Naming, MVC boundaries, middleware order, git.
  environment.md               Env vars, Supabase setup, local run commands.
  deployment.md                Vercel + Render + Supabase deploy steps.
  build-order.md               Day-by-day plan and dependency order.
  design/
    colors.md                  Palette, tokens, Mantine theme object, usage rules.
    fonts.md                   Type scale, families, weights, where serif is allowed.
    ui-patterns.md             Cards, buttons, pills, modals, layout, breakpoints.
  features/
    auth.md
    circles.md
    feed.md
    add-book.md
    book-status.md
    ai-interview.md
    profile.md
    leaderboard.md
  integrations/
    ai-gemini.md
    books-api.md
    storage.md
```

---

## Deferred — do not build

Book detail page · multi-circle UI (DB supports it, UI doesn't) · book recommendations · AI monthly recap · notifications · circle goals · admin roles.
