# The Books Circle - Project Status & Architecture Overview

This document provides a comprehensive overview of the current state of "The Books Circle" project, designed to onboard new developers and provide context to AI assistants.

## 🏗️ Architecture

The project is structured as a monorepo containing a Node.js Express backend (`/server`) and a React Vite frontend (`/client`). It heavily relies on **Supabase** for PostgreSQL database hosting and Authentication (Google OAuth).

### 1. Frontend (`/client`)
Built with **React, Vite, Zustand (State Management), and Mantine (UI Framework)**.
The UI has been meticulously built to match the provided high-fidelity mockups, utilizing a specific color palette (Cream, Surface, Terracotta, Forest) and typography (Inter & Newsreader).

**Key Files & Directories:**
- `src/main.jsx` & `App.jsx`: App entry points and routing logic. Initializes the `authStore`.
- `src/index.css` & `src/theme.js`: Global styling, fonts, and Mantine theme configurations.
- `src/config/supabase.js`: Initializes the `@supabase/supabase-js` client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- `src/stores/authStore.js`: Zustand store that manages user sessions. It listens to `supabase.auth.onAuthStateChange` to automatically persist logins and logouts.
- `src/components/AppShell.jsx`: The global layout wrapper containing the top navigation bar.
- `src/features/auth/AuthPage.jsx`: A split-screen authentication page featuring a single "Continue with Google" button. It calls `supabase.auth.signInWithOAuth`.
- `src/features/feed/FeedPage.jsx`: A complex 3-column layout containing the active circles (left), main posts feed (center), and circle members (right). **Currently uses hardcoded mock data.**
- `src/features/profile/ProfilePage.jsx`: The user profile showing reading stats, dynamic tabs (Want to read/Reading/Finished), and horizontal book cards. **Currently uses hardcoded mock data.**
- `src/features/leaderboard/LeaderboardPage.jsx`: A 2x2 grid displaying various reading leaderboards (Books read, Pages read, etc). **Currently uses hardcoded mock data.**

### 2. Backend (`/server`)
Built with **Node.js, Express, and Zod (Validation)**.

**Key Files & Directories:**
- `index.js` & `src/app.js`: Server initialization, CORS setup, and router mounting.
- `src/config/env.js` & `supabase.js`: Loads environment variables and initializes the Supabase Admin client (using `SUPABASE_SERVICE_ROLE_KEY`).
- `src/middleware/requireAuth.js`: **Crucial security middleware.** It intercepts the `Authorization: Bearer <token>` header from the frontend and verifies it using `supabase.auth.getUser(token)`. This ensures that only users authenticated via Supabase can access protected API routes.
- `src/utils/`: Contains `ApiError.js` (custom error class) and `asyncHandler.js` (wrapper to catch async route errors).
- `src/middleware/errorHandler.js`: Global Express error handler.
- `src/routes/` & `src/controllers/`: Basic routing structure. (Note: Auth routes were initially created for a local JWT strategy but are largely superseded by the client-side Supabase OAuth integration).

## 🚀 Current Working State

1. **Authentication Flow (Google OAuth):**
   - The code is 100% ready for Google OAuth.
   - **Pending Manual Action:** The Google Provider must be enabled in the Supabase Dashboard (Authentication -> Providers -> Google) using a Google Cloud Console Client ID & Secret.
   - Once enabled, clicking "Continue with Google" in the `AuthPage` will redirect to Google, authenticate the user, return to the app, populate the `authStore`, and grant access to the `/feed`.

2. **User Interface:**
   - The UI implementation of Phase 1 & 2 is complete. The application looks exactly like the desktop mockups.

## 🔜 Next Steps (TODOs)

1. **Database Schema Setup (Supabase):**
   - Create tables in Supabase for: `circles`, `circle_members`, `books`, `posts`/`reviews`.
   - Setup Row Level Security (RLS) policies if queried directly from the client, or handle logic via the Node.js backend.
2. **Replace Hardcoded UI Data:**
   - Wire up the frontend components (`FeedPage`, `ProfilePage`, `LeaderboardPage`) to fetch real data from the backend/Supabase instead of displaying static mock components.
3. **Google OAuth Activation:**
   - Provide the Client ID/Secret in the Supabase dashboard to allow real users into the system.
