# The Books Circle 📚

A social reading tracker where you read together with a small, private circle of friends.
Track what you're reading, see your friends' activity in a shared feed, and when you finish a book,
an AI interviews you and turns your answers into a magazine-style review that is posted to your circle.

> Final project of the TechTroop / Elevation Full Stack bootcamp — built by a team of 3 in 5 days.

## Features

- **Reading circles** – create or join private circles (no admins: every member has equal permissions).
- **Shelves & status** – add books from the Open Library catalog and move them between *want to read*, *reading* and *finished*, with ratings.
- **Circle feed** – text posts, reviews, comments and reactions from everyone in your circles.
- **AI book interview** – finishing a book opens a short interview (rating + two questions). Your answers are sent to Gemini, which writes a newspaper-style review that is published to the feed. No blank text box, no editing step.
- **AI Librarian chat** – a reading-buddy chat built on Gemini **function calling**. The model can call server tools to search the book catalog, read your reading list, check your circle's activity, add a book to your list, recommend circles and search reviews — so its answers are based on real app data.
- **Leaderboards & profiles** – reading stats per circle and per user.
- **Google sign-in** via Supabase Auth.
- **Responsive** – a 3-column desktop layout that collapses to a single column with drawers on mobile.

## Tech stack

| Layer | Technology |
|---|---|
| Client | React 18, Vite, React Router, Zustand, Mantine |
| Server | Node.js, Express (MVC), Zod validation |
| Database & Auth | Supabase (Postgres + Google OAuth) |
| AI | Google Gemini (`@google/generative-ai`) – text generation and function calling |
| Book data | Open Library API |

## Architecture

```
Browser (React SPA)
   │  supabase-js (public anon key) ──► Supabase Auth (Google sign-in)
   │
   │  fetch /api/*   Authorization: Bearer <Supabase access token>
   ▼
Express server ── routes → middleware → controller → service → model
   ├──► Supabase Postgres  (service-role key, server-side only)
   ├──► Google Gemini      (interview, review article, AI Librarian)
   └──► Open Library       (book search & metadata)
```

Key design decisions:

- **The browser only talks to Supabase Auth.** All data access goes through Express, so the service-role key and AI keys never reach the client and authorization can't be bypassed.
- **Authorization is enforced on the server.** `requireAuth` validates the Supabase token on every protected request, and services check that a user may only change their own data (e.g. their own `user_books` rows), even with a guessed ID.
- **Every write is validated with Zod**, and the whole API returns one consistent error shape.
- **Layered MVC** – controllers contain no SQL and models contain no HTTP; `snake_case` DB columns are mapped to `camelCase` at the model boundary.

## Project structure

```
the-books-circle/
├── client/          # React + Vite SPA (feature folders under src/features)
├── server/          # Express API (src/routes, controllers, services, models, integrations)
│   └── migrations/  # SQL migrations for the Supabase schema
└── docs/            # Specs: API contract, database, features, design system
```

The `docs/` folder is the project's living spec (API contract, DB schema, feature specs, design tokens).
It was written to be used both by the team and as context for AI coding assistants, with `CLAUDE.md` and
`docs/INDEX.md` routing an agent to only the docs relevant to the task at hand.

## Running locally

Prerequisites: Node.js 20+, a Supabase project with Google sign-in enabled, and a Gemini API key.

```bash
# Server
cd server
cp .env.example .env      # fill in Supabase, Gemini and other values
npm install
npm run dev

# Client (in a second terminal)
cd client
# create .env with VITE_API_URL, VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev               # http://localhost:5173
```

Apply the SQL files in `server/migrations/` to your Supabase database in order.
More details about environment variables are in [`docs/environment.md`](docs/environment.md).
