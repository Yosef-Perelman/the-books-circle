# integrations/storage.md

Supabase Storage — the `book-scans` bucket. Load with `features/add-book.md`.

## What goes in it

**Only user-uploaded cover-scan photos** — the images Gemini reads in the add-by-scan flow.

Not in Storage: book cover art from Google Books (external URLs, `integrations/books-api.md`) and avatars (generated initials, no images).

This bucket is how we satisfy the "external storage for media files" course requirement. It's a small surface — don't over-build it.

## Bucket setup

Supabase dashboard → Storage → New bucket:

- Name: `book-scans`
- **Public**: yes
- File size limit: 5MB
- Allowed MIME types: `image/*`

Public is deliberate. The images are photographs of book covers — not sensitive — and public URLs mean no signed-URL expiry logic. Uploads still go through Express with the service-role key, so nobody can write to the bucket without authenticating with us.

## Upload path

```
book-scans/{userId}/{uuid}.{ext}
```

Namespacing by user makes cleanup and debugging obvious and prevents collisions without a lookup.

## Server

`server/src/integrations/storage.js` is the only file that touches Storage.

```js
import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { randomUUID } from 'node:crypto';
import { ApiError } from '../utils/ApiError.js';

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic' };

export async function uploadScan(userId, file) {
  const ext = EXT[file.mimetype];
  if (!ext) throw new ApiError(422, 'VALIDATION_ERROR', 'Please upload a JPG, PNG, or WebP image.');

  const path = `${userId}/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

  if (error) {
    console.error('storage upload failed', error);
    throw new ApiError(502, 'INTERNAL', "We couldn't save that photo. Please try again.");
  }

  const { data } = supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
```

## Multer

`server/src/middleware/upload.js` — **memory storage**, never disk. Render's filesystem is ephemeral and we're forwarding the buffer to two places anyway (Storage and Gemini).

```js
import multer from 'multer';

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('image/')
      ? cb(null, true)
      : cb(new ApiError(422, 'VALIDATION_ERROR', 'Only image files are allowed.')),
}).single('image');
```

Multer's own `LIMIT_FILE_SIZE` error must be translated in `errorHandler` into a friendly `422` — "That image is too large. Please use a photo under 5MB." — instead of leaking a multer error string.

## Order of operations in the scan endpoint

```
multer → uploadScan()      → scanUrl
       → Gemini vision     → { title, author }
       → Google Books      → metadata
       → 200 { candidate, scanUrl }
```

Upload first, then read. If Gemini fails afterwards, an orphan image sits in the bucket — acceptable. Reading first and uploading after would mean losing the photo on a storage failure, which is worse.

`scanUrl` is returned to the client but **not stored in the database** in MVP. There's no column for it. If you want it later, add `user_books.scan_url` — a one-column migration, not a redesign.

## Client

Client-side pre-checks before uploading, so obvious failures don't cost a round trip:

- Reject over 5MB with an inline message.
- Reject non-images.
- Show a local preview via `URL.createObjectURL` immediately, and `revokeObjectURL` on unmount.
- Consider downscaling to max 1600px on the long edge via a canvas before upload — phone photos are 3–5MB and downscaling makes both the upload and the Gemini call meaningfully faster. Optional, but it's the single biggest perceived-speed win in the scan flow.

The client uploads to **our** endpoint (`POST /api/books/scan`), not to Supabase. It has no Supabase credentials and never will.

## Security

- Only `requireAuth`'d users can upload.
- The path is derived from `req.user.id` server-side — never from a client-supplied field.
- The service-role key lives only on the server.
- MIME type is checked by multer **and** mapped through the `EXT` allowlist, so a renamed `.exe` can't get an arbitrary extension.
- No signed URLs needed, since the bucket is public by design.

## Cleanup

None in MVP. Orphaned scans accumulate; at bootcamp volume that's a few megabytes. If it ever mattered, a periodic job could delete scans older than 30 days — mention it as known technical debt rather than building it.

## Out of scope

Avatar uploads · deleting scans · signed/private URLs · image transformations via Supabase · CDN configuration · re-hosting Google Books cover art.
