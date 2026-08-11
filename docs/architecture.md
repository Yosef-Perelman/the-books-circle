# architecture.md

System shape, folder tree, and dependencies. Load when scaffolding or when you need to know where a file goes.

## Shape

```
Browser (React SPA on Vercel)
   │  supabase-js (anon key) ──► Supabase Auth   (Google sign-in, session)
   │
   │  fetch  /api/*   Authorization: Bearer <supabase-access-token>
   ▼
Express server (Render)  ── MVC ──  routes → middleware → controller → service → model
   │                    │                │
   │                    │                └──► @supabase/supabase-js  (service-role key)
   │                    │                          │
   │                    │                          ├──► Postgres (Supabase)
   │                    │                          ├──► Storage bucket `book-scans`
   │                    │                          └──► Auth API — validate tokens (requireAuth)
   │                    ├──► Google Gemini API   (vision + text)
   │                    └──► Google Books API    (metadata)
```

**The client only ever talks to Supabase Auth directly, and nothing else.** Sign-in and session handling go straight from the browser to Supabase (via the public anon key — see `features/auth.md`). Postgres, Storage, Gemini, and Google Books all stay behind Express, proxied so the service-role key and other API keys stay server-side and so validation/authorization is unavoidable.

## Folder tree

```
the-books-circle/
├── CLAUDE.md
├── docs/
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx                 # ReactDOM root, MantineProvider, BrowserRouter
│       ├── App.jsx                  # route table
│       ├── theme.js                 # Mantine theme — see design/colors.md, design/fonts.md
│       ├── config/
│       │   └── supabase.js          # createClient(url, anonKey) — Auth only, never DB/Storage
│       ├── api/
│       │   ├── client.js            # fetch wrapper: base URL, bearer header, error normalisation
│       │   ├── auth.js
│       │   ├── circles.js
│       │   ├── books.js
│       │   ├── userBooks.js
│       │   ├── posts.js
│       │   └── reviews.js
│       ├── stores/
│       │   ├── authStore.js         # user, token, login/logout
│       │   ├── circleStore.js       # circles list, activeCircleId
│       │   └── uiStore.js           # open modal, toasts
│       ├── components/              # shared, feature-agnostic
│       │   ├── AppShell.jsx         # navbar + 3-column layout
│       │   ├── BookCover.jsx
│       │   ├── StarRating.jsx
│       │   ├── StatusPills.jsx
│       │   ├── Avatar.jsx
│       │   ├── EmptyState.jsx
│       │   └── ErrorBanner.jsx
│       ├── features/
│       │   ├── auth/                # WelcomePage, AuthPage, LoginForm, RegisterForm
│       │   ├── circles/             # CirclesSidebar, MembersSidebar, JoinCreateCircleModal
│       │   ├── feed/                # FeedPage, PostComposer, PostCard, CommentList
│       │   ├── books/               # AddBookModal, ScanTab, SearchTab, ManualTab
│       │   ├── interview/           # InterviewModal, QuestionBubble, AnswerBox
│       │   ├── profile/             # ProfilePage, BookRow, StatusTabs
│       │   └── leaderboard/         # LeaderboardPage, CategoryCard, RankBadge
│       └── lib/
│           ├── formatters.js        # relative time, page counts
│           └── constants.js         # STATUS, POST_TYPE, LEADERBOARD_CATEGORY enums
└── server/
    ├── package.json
    ├── index.js                     # createApp() + listen
    └── src/
        ├── app.js                   # express(), cors, json, /api mount, error middleware LAST
        ├── config/
        │   ├── env.js               # reads + validates process.env at boot, throws if missing
        │   └── supabase.js          # exports a single configured client
        ├── routes/                  # thin: path → middleware → controller fn
        │   ├── index.js
        │   ├── auth.routes.js
        │   ├── circles.routes.js
        │   ├── books.routes.js
        │   ├── userBooks.routes.js
        │   ├── users.routes.js
        │   └── posts.routes.js
        ├── controllers/             # req/res only. no SQL, no AI calls.
        ├── services/                # business logic. no req/res.
        │   ├── auth.service.js
        │   ├── circle.service.js
        │   ├── book.service.js
        │   ├── userBook.service.js
        │   ├── review.service.js
        │   ├── feed.service.js
        │   └── leaderboard.service.js
        ├── models/                  # the ONLY files that touch supabase queries
        │   ├── user.model.js
        │   ├── circle.model.js
        │   ├── book.model.js
        │   ├── userBook.model.js
        │   ├── review.model.js
        │   ├── post.model.js
        │   └── comment.model.js
        ├── integrations/
        │   ├── gemini.js            # see integrations/ai-gemini.md
        │   ├── googleBooks.js       # see integrations/books-api.md
        │   └── storage.js           # see integrations/storage.md
        ├── middleware/
        │   ├── requireAuth.js       # verifies JWT → req.user
        │   ├── requireCircleMember.js
        │   ├── validate.js          # validate(schema, 'body'|'query'|'params')
        │   ├── upload.js            # multer memoryStorage, 5MB, images only
        │   └── errorHandler.js      # LAST. one response shape.
        ├── schemas/                 # Zod schemas, one file per resource — none for auth (no auth.schema.js): sign-in is unvalidated Supabase input, not a client-submitted form
        └── utils/
            ├── ApiError.js          # class ApiError extends Error { status, code, details }
            ├── asyncHandler.js      # wraps async controllers so errors reach middleware
            └── inviteCode.js        # generates F1-8KZQ style codes
```

## Layer rules

| Layer | May do | May NOT do |
|---|---|---|
| route | mount path, attach middleware | any logic |
| middleware | auth, validation, uploads | business rules |
| controller | read `req`, call one service, send `res` | SQL, AI calls, multi-step orchestration |
| service | orchestrate models + integrations, enforce business rules | touch `req`/`res`, write raw queries |
| model | supabase queries, snake_case ↔ camelCase mapping | business rules, HTTP concerns |
| integration | one external API each | know about our DB |

A controller that is more than ~15 lines is doing a service's job.

## Request lifecycle

```
POST /api/user-books
  → express.json()
  → requireAuth            (401 if bad/absent token → req.user = { id, email })
  → validate(createUserBookSchema, 'body')   (422 with field errors if bad)
  → userBooks.controller.create
      → userBook.service.addBook(userId, payload)
          → book.model.findOrCreateByIsbnOrTitle()
          → userBook.model.insert()
          → post.model.insert({ type: 'added' })
      → res.status(201).json({ data })
  → (on throw) errorHandler → { error: { code, message, details } }
```

## Dependencies

**client**
```
react react-dom react-router-dom
@mantine/core @mantine/hooks @mantine/notifications @mantine/dropzone
zustand
@supabase/supabase-js         # Auth only — sign-in + session, never DB/Storage
@tabler/icons-react
```
Dev: `vite @vitejs/plugin-react`

**server**
```
express cors dotenv
@supabase/supabase-js
zod
multer
@google/generative-ai
```
No `bcrypt`, no `jsonwebtoken` — there's no local password hash and no locally-signed token; `requireAuth` validates the Supabase-issued token via a live `supabase.auth.getUser` call instead.

Dev: `nodemon`

Do not add anything else without flagging it. No axios (use `fetch`), no lodash, no moment/dayjs (write the two formatters we need by hand), no ORM.

## Data flow of the three interesting operations

**Add by scan** — client uploads image → `POST /api/books/scan` (multer) → upload to Storage → Gemini vision returns `{title, author}` → Google Books lookup fills genre/pages/cover → response is a *candidate*, nothing saved yet → user confirms → `POST /api/user-books`.

**Finish a book** — client asks `GET /api/user-books/:id/interview/questions` → Gemini generates 2–3 questions → user answers client-side (no round trips) → `POST /api/user-books/:id/review` with the full Q&A → server generates the article, inserts `reviews`, flips `user_books.status = 'finished'` + `finished_at`, inserts a `finished` feed post — **all three or none**. See `features/ai-interview.md`.

**Leaderboard** — pure aggregation over `user_books` joined to `books`, filtered by circle membership and period. No leaderboard table, no cron. See `features/leaderboard.md`.

## Deliberate simplifications

- No realtime/websockets. The feed refetches on mount and after a mutation.
- No pagination on the feed for MVP — cap at 50 posts, ordered `created_at desc`.
- No image re-hosting for books-API cover art; store the external URL.
- No refresh tokens. One 7-day JWT.
