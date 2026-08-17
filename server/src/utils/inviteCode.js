// Unambiguous alphabet — no I, O, 0 or 1, so a code read aloud or copied off a
// screen can't be mistyped. Format is XX-XXXX (e.g. F1-8KZQ).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PREFIX_LENGTH = 2;
const SUFFIX_LENGTH = 4;

function randomChars(length) {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function generateInviteCode() {
  return `${randomChars(PREFIX_LENGTH)}-${randomChars(SUFFIX_LENGTH)}`;
}

// Accepts anything a user might type — 'f18kzq', 'F1 8KZQ', 'f1-8kzq' — and
// returns the canonical stored form 'F1-8KZQ', or null if it can't be one.
export function normalizeInviteCode(raw) {
  if (typeof raw !== 'string') return null;

  const stripped = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (stripped.length !== PREFIX_LENGTH + SUFFIX_LENGTH) return null;

  return `${stripped.slice(0, PREFIX_LENGTH)}-${stripped.slice(PREFIX_LENGTH)}`;
}
