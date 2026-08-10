# conventions.md

Naming, boundaries, and the small decisions that should never be re-argued. Load when scaffolding or when unsure where code belongs.

## Naming

| Thing | Style | Example |
|---|---|---|
| Folders | kebab-case | `src/features/add-book/` |
| React components | PascalCase.jsx | `PostCard.jsx` |
| Other JS files (client) | camelCase.js | `userBooks.js`, `authStore.js` |
| Server files | `<name>.<layer>.js` | `userBook.service.js`, `circle.model.js` |
| Zod schemas | `<resource>.schema.js`, exports `createXSchema` | `userBook.schema.js` |
| DB tables & columns | snake_case, tables plural | `user_books.finished_at` |
| JS variables & JSON keys | camelCase | `finishedAt` |
| Constants / enums | SCREAMING_SNAKE in `constants.js` | `STATUS.FINISHED` |
| Env vars | SCREAMING_SNAKE, client ones prefixed `VITE_` | `GEMINI_API_KEY` |
| Booleans | `is` / `has` / `can` prefix | `isOwnProfile`, `likedByMe` |
| Handlers | `handleX` in components, `onX` as props | `onSelect={handleSelect}` |

Never use `data`, `item`, `res`, `obj` as a variable name outside a two-line map.

## Enums live in one place each

Client: `client/src/lib/constants.js`
Server: `server/src/utils/constants.js`

```js
export const STATUS = { WANT: 'want', READING: 'reading', FINISHED: 'finished' };
export const POST_TYPE = { STARTED: 'started', ADDED: 'added', FINISHED: 'finished' };
export const SOURCE = { SCAN: 'scan', SEARCH: 'search', MANUAL: 'manual' };
```

String literals like `'finished'` should not appear inline anywhere except these files and the SQL.

## Server layer boundaries

Repeated from `architecture.md` because it's the rule most often broken:

- **Controllers** read `req`, call exactly one service function, send `res`. If a controller has an `if` about business rules, move it.
- **Services** never import `express` and never see `req`/`res`. They take plain arguments and throw `ApiError`.
- **Models** are the only files importing the supabase client. They map `snake_case → camelCase` on the way out and back on the way in.
- **Integrations** know one external API each and nothing about our tables.

### Error throwing

Services throw, never return error objects:

```js
import { ApiError } from '../utils/ApiError.js';

if (userBook.user_id !== userId) {
  throw new ApiError(403, 'FORBIDDEN', "You can only change your own books.");
}
```

Controllers are wrapped so throws reach the middleware:

```js
router.patch('/:id', requireAuth, validate(updateStatusSchema), asyncHandler(userBooks.updateStatus));
```

### Middleware order in `app.js` — this order, always

```js
app.use(cors({ origin: env.CLIENT_URL, credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', routes);
app.use(notFoundHandler);   // 404 for unmatched /api paths
app.use(errorHandler);      // MUST be last, MUST have 4 args
```

`errorHandler` is the only place that formats an error response:

```js
export function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  const status = isApiError ? err.status : 500;
  if (!isApiError) console.error(err);            // log real bugs, never send them
  res.status(status).json({
    error: {
      code: isApiError ? err.code : 'INTERNAL',
      message: isApiError ? err.message : 'Something went wrong. Please try again.',
      ...(err.details && { details: err.details }),
    },
  });
}
```

## Validation

Every route with a body, and every route with a query param that matters, gets a Zod schema. No exceptions, no "it's just an id".

```js
export const createUserBookSchema = z.object({
  book: z.object({
    title: z.string().trim().min(1, 'Title is required').max(300),
    author: z.string().trim().max(200).optional(),
    genre: z.string().trim().max(100).optional(),
    pageCount: z.coerce.number().int().positive('Page count must be a positive number').max(20000).optional(),
    coverUrl: z.string().url().optional(),
    isbn: z.string().trim().max(20).optional(),
  }),
  source: z.enum(['scan', 'search', 'manual']),
  circleId: z.string().uuid(),
});
```

`validate(schema, source = 'body')` runs `safeParse`, and on failure throws `ApiError(422, 'VALIDATION_ERROR', 'Please check the highlighted fields.', fieldMap)` where `fieldMap` is `{ 'book.pageCount': 'Page count must be a positive number' }`. The client renders those directly under inputs.

Zod messages are written for the end user, not the developer.

## Client conventions

- Function components only. No class components.
- One component per file, default export, file named after the component.
- A component over ~150 lines is two components.
- Data fetching lives in `src/api/*.js`, never inline `fetch` in a component.
- No `useEffect` for anything but fetch-on-mount and subscriptions. Derive, don't sync.
- Every list render has three sibling states handled: loading, error, empty.
- No inline hex colors, no inline `px` font sizes. Theme tokens only — `design/colors.md`, `design/fonts.md`.

### Component file order

```jsx
// imports
// component
export default function PostCard({ post }) {
  // 1. hooks
  // 2. derived values
  // 3. handlers
  // 4. early returns (loading / error / empty)
  // 5. main return
}
```

## Comments

Comment *why*, never *what*. A comment explaining a non-obvious business rule is valuable:

```js
// finished is only reachable via the review endpoint — the interview is mandatory
```

Delete commented-out code. Do not write JSDoc blocks for two-line functions.

## Git

- Branches: `feat/<area>-<thing>`, `fix/<area>-<thing>`.
- Commits, imperative and scoped: `feat(feed): add like toggle`, `fix(auth): reject expired token`.
- Never commit `.env`. Commit `.env.example` with every key present and empty.
- Never commit `node_modules`, `dist`, or scan images.

## Things we deliberately do not do

- No tests in this build (no time; don't add a framework unless asked).
- No TypeScript, no PropTypes.
- No i18n. English only, strings inline in components.
- No dark mode.
- No global CSS files beyond a tiny `index.css` reset — Mantine props and the theme do the styling.
- No `console.log` left in committed code. `console.error` in the error handler is the one exception.
