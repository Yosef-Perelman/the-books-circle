# The Books Circle - Project Status & Architecture Overview

This document provides a comprehensive overview of the current state of "The Books Circle" project, designed to onboard new developers and provide context to AI assistants.

## 🏗️ Architecture

The project is structured as a monorepo containing a Node.js Express backend (`/server`) and a React Vite frontend (`/client`). It uses **Supabase** for PostgreSQL database hosting and Authentication (Google OAuth), and **OpenLibrary API** for book metadata.

### 1. Frontend (`/client`)
Built with **React, Vite, Zustand (State Management), and Mantine (UI Framework)**.
The UI matches high-fidelity mockups, utilizing a specific color palette (Cream, Surface, Terracotta, Forest) and typography (Inter & Newsreader).

**Key Features & Files:**
- **State Management**: `authStore.js` manages user sessions; `chatStore.js` manages the persistent AI reading buddy chat history.
- **API Client**: `api/client.js` wraps `fetch` to automatically attach the Supabase JWT token.
- **Feed & Posts**: `FeedPage.jsx` pulls real-time posts from the backend. Users can post text updates or book reviews using `CreatePostWidget.jsx` and `BookSelectModal.jsx`.
- **Book Discovery**: `ExplorePage.jsx` and `SearchPage.jsx` allow users to browse and search the OpenLibrary catalog.
- **AI Reading Buddy**: `ChatPage.jsx` provides an intelligent chat interface built with `react-markdown` to discuss books.
- **Profiles & Leaderboards**: Display real user reading statistics and book shelves.

### 2. Backend (`/server`)
Built with **Node.js, Express, and Google Gemini AI**.

**Key Features & Files:**
- **Database Access**: Uses `@supabase/supabase-js` to perform secure queries against the database (e.g., `userBook.service.js`, `post.model.js`).
- **AI Integration**: `ai.service.js` uses `@google/generative-ai` to power the Reading Buddy chat interface.
- **Google Books / OpenLibrary**: Integrated via `googleBooks.js` (initially Google Books, adapted for general use) to fetch external metadata.
- **Controllers & Routes**: Structured into logical domains (`auth`, `users`, `books`, `circles`, `posts`, `chat`).
- **Security**: `requireAuth.js` middleware validates Supabase JWTs.

## 🚀 Current Working State

1. **Fully Functional Authentication:** Google OAuth via Supabase is fully configured and working.
2. **Real Data Integration:** Hardcoded mock data has been completely replaced. The app fetches live data from Supabase.
3. **Interactive Feed:** Users can write custom text posts, review books, and see posts dynamically populate across their reading circles.
4. **AI Reading Buddy:** A persistent, context-aware AI chat system is fully deployed.

## 🔜 Next Steps (TODOs)

1. **User Onboarding:** Improve the initial flow for newly registered users (e.g., picking their first circle).
2. **Push Notifications:** Alert users when someone replies to their post or review.
3. **Reading Sessions:** Add tools for users to log specific reading sessions (e.g., "I read 20 pages today") to better populate the leaderboards.
