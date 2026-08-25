# integrations/storage.md

Supabase Storage — the `avatars` bucket.

**Status: not yet built.** This doc describes the intended shape for a future user-avatar-image upload. No code in this repo calls `supabase.storage` today. This bucket is how we intend to satisfy the "external storage for media files" course requirement once built. It's a small surface — don't over-build it.

## What goes in it

**User-uploaded avatar images**, once that feature exists.

Not in Storage: book cover art from Google Books (external URLs, `integrations/books-api.md`). Today, avatars are either the Google OAuth profile picture (an external URL captured at sign-in, `features/auth.md`) or a generated-initials fallback (`client/src/lib/avatarColor.js`) — neither touches Storage.

## Bucket setup (when built)

Supabase dashboard → Storage → New bucket:

- Name: `avatars`
- **Public**: yes
- File size limit: 5MB
- Allowed MIME types: `image/*`

Public is deliberate. Profile photos aren't sensitive, and public URLs mean no signed-URL expiry logic. Uploads would still go through Express with the service-role key, so nobody can write to the bucket without authenticating with us.

## Upload path (proposed)

```
avatars/{userId}.{ext}
```

One avatar per user — a re-upload overwrites the previous file (`upsert: true`), unlike a history of scan photos.

## Server (not implemented)

A future `server/src/integrations/storage.js` would be the only file that touches Storage, following the same shape as other integrations here: a multer memory-storage middleware (`fileFilter: image/*`, size limit), an upload function that writes the buffer to the bucket and returns the public URL, and a route like `PATCH /api/users/me/avatar`.

## Security (for when built)

- Only `requireAuth`'d users can upload, and only to their own path.
- The path is derived from `req.user.id` server-side — never from a client-supplied field.
- The service-role key lives only on the server.
- No signed URLs needed, since the bucket is public by design.

## Out of scope

Cover scanning (removed) · deleting avatars · signed/private URLs · image transformations via Supabase · CDN configuration · re-hosting Google Books cover art.
