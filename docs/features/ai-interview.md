# features/ai-interview.md

**The differentiator.** Finishing a book opens a short AI interview; the answers become a newspaper-style article that is posted as the review. Load with `integrations/ai-gemini.md` and `api-contract.md`.

## The idea

Nobody writes book reviews, because a blank text box is intimidating. Answering two questions about a book you just finished is easy. So the app never asks for a review — it asks two questions and writes the review for you.

**There is no blank-page step and no editing step.** Answer → Post → the article is generated and published.

## Trigger

The user clicks the **Finished** pill on their own profile (or picks Finished in the add-book confirm card). This does **not** call PATCH — `features/book-status.md` explains why. It opens `InterviewModal`.

If the user cancels, the book's status is unchanged. `finished` is only reachable by completing the interview.

## The modal

Max-width 640, radius 24, full-screen below 768px.

```
Finished Book
The Hobbit — J.R.R. Tolkien
[88×132 cover]

How would you rate it?
★ ★ ★ ★ ☆        (28px, half-steps, hover preview)

┌ Q ┐  What stuck with you most about this book?
└───┘

        ┌──────────────────────────────────────────┐
        │ A │  the user's answer                   │
        └──────────────────────────────────────────┘

┌ Q ┐  Who would you recommend it to?
└───┘
        [ textarea, autofocused ]

                              [Cancel]  [Post]
```

Per the mockup:

- **Q badge** — `forest` circle, `surface` letter, left-aligned, with the question in a `greenTint` bubble.
- **A badge** — `gold`/`terracotta` circle, and the answer sits in a **wider** box, right-aligned, `surface` background with a `line` border.
- Questions appear **one at a time**, chat style. The next question only appears after the current answer is submitted (Enter or the arrow button).
- Answered turns stay visible above, so the user can see what they've said.

### Rating
A 0–5 star input in half-steps, above the first question. Required — Post stays disabled until a rating is set. It's one click and it powers the feed post and the leaderboard's implicit quality signal.

### Buttons
`Cancel` (ghost) and `Post` (primary). `Post` is enabled once the rating is set and **at least one** answer is non-empty — the user can skip the last question if they want out.

Escape and overlay click do **not** close the modal once any answer is typed; show a confirm ("Discard this review?") first. Losing typed answers to a stray click is the worst possible bug here.

## Questions

`GET /api/user-books/:id/interview/questions` returns **2–3 short, personal questions**, generated from title, author, and genre.

Personal and specific, not academic:

- "What stuck with you most about this book?"
- "Who would you recommend it to?"
- "Was there a moment that surprised you?"

**Never block on Gemini.** If generation fails or is slow, fall back to a static set:

```js
const FALLBACK_QUESTIONS = [
  'What stuck with you most about this book?',
  'Who would you recommend it to?',
  'How did it leave you feeling?',
];
```

The user must never see an error here — a failure just means slightly less tailored questions.

Prefetch the questions when the modal opens, alongside rendering the cover, so the first question is on screen fast.

## Answers

Collected entirely **client-side**. No round trip per turn — a stateful multi-turn server interview is more moving parts than this build needs.

Answers are 1–1000 chars, trimmed. Empty answers are dropped from the payload rather than sent as blanks.

## Posting — two endpoints, generate then publish

Unlike the original single-shot design, the built modal has a review-editing step between generation and posting (see "Rules that are easy to get wrong" below), so posting is split across two endpoints:

**`POST /api/user-books/:id/interview/review`** — generation only, nothing written to the database yet.
```
requireAuth → Gemini: qa + book metadata → articleText → 200 { articleText }
```
The modal shows the draft in an editable textarea. The user can revise it before posting.

**`POST /api/user-books/:id/review`** — publish. `{ content }`, no `circleId` — the review goes to **every circle the user belongs to**, the same reach as the `added`/`started` posts (`features/circles.md`).
```
requireAuth
  → service:
      1. fetch user_book → 404 if missing or not owned by the caller (never 403 — see `api-contract.md`)
      2. insert feed_posts { type: 'review', content, userBookId } for each of the caller's circles
      3. update user_books { status: 'finished', finishedAt: now() }
  → 201 { data: { posts: Post[] } }
```
If the user is in no circles, the review is still published — the book still flips to `finished` — but no post is created anywhere; the modal says so before publishing.

There is no `reviews` table row and no separate rating field on this endpoint — the review's text *is* the `feed_posts.content`, and rating stays on the shelf's star control (`BookCard`), independent of the interview.

**Posts before status.** If step 3 fails, step 2's posts already exist — clean them up in a `catch` (delete each, then rethrow) rather than leave a review with a stale status. This is a deliberate compensating action, not sloppiness, because there's no multi-statement transaction over the Supabase JS client.

### On Gemini failure during generation
`502` with "We couldn't write your review just now. Please try again." The modal keeps the typed answers and shows a Retry. **Never lose the user's answers.**

## The article

`article_text` is a **newspaper/magazine-style review**, not a casual blurb. Treat it like a short editorial piece.

Constraints (enforced in the prompt, see `integrations/ai-gemini.md`):

- ~120–180 words, 2–3 paragraphs, plain text (no markdown, no headings).
- Third-person editorial voice referring to the reader by display name where natural ("For Avi, the book's charm was…").
- Built **only** from what the user actually said. No invented plot details, no facts about the book beyond title/author/genre.
- Warm and literary, never breathless marketing copy.
- No spoilers beyond what the user volunteered.

Rendered in the serif at 16/1.7 in the finished feed post and clamped to 2 lines as a snippet on the profile (`design/fonts.md`).

## Why we store the raw Q&A

`reviews.qa_json` keeps every `{q, a}` pair forever. Reasons:

1. Regeneration — if a prompt improves, articles can be rewritten from source.
2. Debugging — when an article reads oddly, the input is right there.
3. **Demo value** — "explainable AI output": we can show exactly what the user said and what the model made of it. Say this out loud in the presentation.

Never discard the Q&A after generation.

## After posting

Close the modal → toast "Your review is live." → refetch the feed (the review post is at the top of each of the user's circles) and the profile's Finished tab and Reviews tab.

Consider scrolling the new post into view on the feed. Nice, not required.

## Rules that are easy to get wrong

- The built modal *does* have an editing step between generation and posting — the draft is shown in an editable textarea before the user publishes. This is a deliberate divergence from the original no-edit design; don't "fix" it back.
- Questions come one at a time, not all at once.
- Gemini failures never block the questions (fallback) but do block posting (retry).
- Typed answers survive every failure path.
- The article is generated **before** anything is written to the database.
- Status becomes `finished` here and nowhere else — `PATCH /api/user-books/:id/status` rejects `finished` with 400 (`features/book-status.md`).
- Exactly **one** post per circle per finished book. There is no separate `finished` post — the review post is the finished announcement.

## Out of scope

Editing or deleting a review · regenerating an article from the UI · re-interviewing · voice answers · multi-turn follow-up questions from the model · reviews on books you haven't finished.
