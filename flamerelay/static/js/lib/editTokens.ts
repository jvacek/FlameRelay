const STORAGE_KEY = 'checkin_edit_tokens';
// Matches CHECKIN_EDIT_GRACE_PERIOD_HOURS and CHECKIN_DELETE_GRACE_PERIOD_HOURS on the backend.
// Frontend expiry is best-effort cleanup only — the backend enforces the authoritative check.
const EDIT_GRACE_MS = 6 * 60 * 60 * 1000;

interface StoredToken {
  token: string;
  storedAt: number;
}

function readAll(): Record<string, StoredToken> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<
      string,
      StoredToken
    >;
  } catch {
    return {};
  }
}

function isValid(entry: unknown): entry is StoredToken {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'token' in entry &&
    'storedAt' in entry &&
    Date.now() - (entry as StoredToken).storedAt < EDIT_GRACE_MS
  );
}

export function storeEditToken(checkinId: number, token: string): void {
  const entries = readAll();
  const pruned: Record<string, StoredToken> = {};
  for (const [id, entry] of Object.entries(entries)) {
    if (isValid(entry)) pruned[id] = entry;
  }
  pruned[String(checkinId)] = { token, storedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
}

export function getEditToken(checkinId: number): string | null {
  const entry = readAll()[String(checkinId)];
  return isValid(entry) ? entry.token : null;
}
