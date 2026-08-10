# integrations/ai-gemini.md

Google Gemini — vision (cover scan) and text (interview questions, review article). One SDK for all three. Load with `features/add-book.md` or `features/ai-interview.md`.

## Setup

```bash
npm i @google/generative-ai
```

```bash
GEMINI_API_KEY=...
GEMINI_TEXT_MODEL=gemini-2.0-flash
GEMINI_VISION_MODEL=gemini-2.0-flash
```

One model handles both modalities. Model IDs change — verify the current name before assuming.

All of this lives in `server/src/integrations/gemini.js`. **Nothing else in the codebase imports the SDK.** The key never reaches the client.

```js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const textModel   = genAI.getGenerativeModel({ model: env.GEMINI_TEXT_MODEL });
const visionModel = genAI.getGenerativeModel({ model: env.GEMINI_VISION_MODEL });

export async function readBookCover(imageBuffer, mimeType) { /* ... */ }
export async function generateInterviewQuestions(book)     { /* ... */ }
export async function generateReviewArticle(input)         { /* ... */ }
```

Three exported functions. Each returns a plain object or throws `ApiError`. Services call these; controllers never do.

## Shared rules

- **Every call is wrapped in try/catch.** A Gemini failure must never surface as a 500 with an upstream message.
- **Every call has a timeout** — 15s for vision, 20s for the article. Race the promise against a timeout and throw on loss.
- **Never send user PII.** Only book metadata and the answers the user typed.
- **Ask for JSON, but never trust it.** Models wrap JSON in ```` ```json ```` fences. Strip fences, then `JSON.parse` inside a try; on parse failure use the fallback path.
- **Temperature:** 0.1 for vision (extraction, not creativity), 0.8 for the article (it's writing).
- Log failures with `console.error` server-side; send the user a friendly message.

```js
function parseJsonLoose(text) {
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(cleaned); } catch { return null; }
}
```

## 1. Cover scan — `readBookCover(buffer, mimeType)`

Used by `POST /api/books/scan`.

```
system-ish instruction + inlineData(base64 image)
→ { "title": string|null, "author": string|null, "confidence": "high"|"low" }
```

**Prompt:**

> You are reading a photograph of a book cover. Extract exactly two things: the book's title and its author.
>
> Rules:
> - Return only what is printed on the cover. Do not guess, complete, or correct from memory.
> - Ignore taglines, review quotes, series names, publisher names, and award stickers.
> - If the image is not a book cover, or the text is unreadable, return nulls with confidence "low".
> - Set confidence to "high" only if both title and author are clearly legible.
>
> Respond with JSON only, no markdown fences:
> `{"title": string|null, "author": string|null, "confidence": "high"|"low"}`

Config: `temperature: 0.1`, `maxOutputTokens: 200`.

**Handling:**

| Result | Action |
|---|---|
| `title` present, `confidence: high` | Look up in Google Books, return the merged candidate |
| `title` present, `confidence: low` | Return the candidate but flag it — client pre-fills the manual form |
| `title` null | Throw `ApiError(422, 'BAD_REQUEST', "We couldn't read that cover. Try better lighting, or search instead.")` |
| Parse failure or timeout | Same 422 — a failed read and a failed parse look identical to the user |

Gemini's title/author win over the Books API's. The Books API's genre, page count, cover art, and ISBN win over anything Gemini might infer — it should not be inferring those at all.

## 2. Interview questions — `generateInterviewQuestions({ title, author, genre })`

Used by `GET /api/user-books/:id/interview/questions`.

**Prompt:**

> Write 2 or 3 short questions to ask someone who has just finished reading "{title}" by {author} ({genre}).
>
> The questions should:
> - Be personal and about their experience, not about plot facts or analysis
> - Be answerable in one or two sentences
> - Be under 15 words each
> - Avoid spoilers and avoid assuming they liked it
>
> Good examples: "What stuck with you most about this book?" · "Who would you recommend it to?"
>
> Respond with a JSON array of strings only, no markdown fences.

Config: `temperature: 0.7`, `maxOutputTokens: 200`.

**Fallback is mandatory.** On any failure — timeout, parse error, empty array — return:

```js
const FALLBACK_QUESTIONS = [
  'What stuck with you most about this book?',
  'Who would you recommend it to?',
  'How did it leave you feeling?',
];
```

This endpoint **never returns an error**. Worst case, the questions are generic. Blocking the user's review on an AI hiccup would be absurd.

Also validate the shape: an array of 2–3 non-empty strings, each ≤120 chars. Anything else → fallback.

## 3. Review article — `generateReviewArticle({ book, displayName, rating, qa })`

Used by `POST /api/user-books/:id/review`. The most important prompt in the app.

**Prompt:**

> You are a books columnist writing a short review for a magazine's reading section.
>
> A reader named {displayName} has just finished "{title}" by {author} ({genre}) and rated it {rating} out of 5. They answered these questions:
>
> Q: {q1}
> A: {a1}
> Q: {q2}
> A: {a2}
>
> Write their review as a polished magazine-style piece.
>
> Requirements:
> - 120–180 words, 2 or 3 short paragraphs
> - Editorial voice — considered and warm, never breathless marketing copy
> - Refer to the reader by first name where it reads naturally
> - **Use only what the reader actually said.** Do not invent plot points, characters, themes, or facts about the book. If their answers are thin, keep the piece short rather than padding it.
> - Reflect the rating in the tone without stating the number
> - No spoilers beyond what the reader volunteered
> - Plain prose only — no markdown, no headings, no bullet points, no title
>
> Return only the article text.

Config: `temperature: 0.8`, `maxOutputTokens: 400`.

The "use only what the reader said" rule is the one that matters. Without it the model writes a confident review of a book it's half-remembering, and the whole feature becomes untrustworthy — a demo-killer if someone asks about hallucination.

**Handling:**

- Trim the response, strip stray markdown, collapse triple newlines.
- Reject an article under 40 characters → treat as failure.
- On failure: throw `ApiError(502, 'INTERNAL', "We couldn't write your review just now. Please try again.")`. The modal keeps the answers and shows Retry (`features/ai-interview.md`).
- **Generate before writing anything to the database.** A failure then leaves no partial state.

## Retries

One retry, only on timeout or 5xx, with a 1s delay. Never retry a 4xx (bad key, bad request) — it will fail identically and cost the user another 15 seconds.

429 from Gemini → surface `ApiError(429, 'RATE_LIMITED', 'The AI is busy right now. Please try again in a moment.')`.

## Cost & quota

Free tier is comfortably enough for this project. Rough usage: one vision call per scan, one text call per interview opened, one per review posted. Nothing runs on a schedule and nothing runs in a loop.

If the free quota is hit during the demo, the fallback questions still work and only the article generation fails — so the app degrades rather than dies.

## Why Gemini

One SDK covers vision and text, the free tier is generous, and `gemini-2.0-flash` is fast enough that the scan feels responsive. This is decided; don't re-open it mid-build.

If a swap ever became necessary, only `gemini.js` changes — three functions with stable signatures. That's why nothing else imports the SDK.
