import { useEffect, useState } from 'react';

interface UserDetailProps {
  username: string;
  settingsUrl: string;
  isSuperuser: boolean;
  adminUrl: string;
}

interface UserData {
  username: string;
  name: string;
}

interface SubscribedUnit {
  identifier: string;
  checkin_count: number;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function UserDetail({
  username,
  settingsUrl,
  isSuperuser,
  adminUrl,
}: UserDetailProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [subscribedUnits, setSubscribedUnits] = useState<
    SubscribedUnit[] | null
  >(null);

  useEffect(() => {
    fetch(`/api/users/${username}/`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: UserData | null) => setUser(data))
      .catch(console.error);
  }, [username]);

  useEffect(() => {
    fetch('/api/users/me/subscriptions/')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SubscribedUnit[] | null) => setSubscribedUnits(data ?? []))
      .catch(console.error);
  }, []);

  const displayName = user?.name || username;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amber text-xl font-bold text-white">
          {initials(displayName)}
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold text-char">
            {displayName}
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={settingsUrl}
          className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Settings
        </a>
        {isSuperuser && (
          <a
            href={adminUrl}
            className="rounded-lg bg-char px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Admin
          </a>
        )}
      </div>

      <section className="mt-10 border-t border-char/10 pt-8">
        <h2 className="font-heading mb-4 text-xl font-semibold text-char">
          Subscribed Units
        </h2>
        {subscribedUnits === null ? null : subscribedUnits.length === 0 ? (
          <p className="text-smoke">
            You&apos;re not subscribed to any units yet.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {subscribedUnits.map((unit) => (
              <li key={unit.identifier}>
                <a
                  href={`/unit/${unit.identifier}/`}
                  className="flex items-center justify-between rounded-lg border border-smoke/20 bg-white px-4 py-3 hover:border-amber/60 hover:shadow-sm"
                >
                  <span className="font-heading font-semibold text-char">
                    {unit.identifier}
                  </span>
                  <span className="text-sm text-smoke">
                    {unit.checkin_count} check-in
                    {unit.checkin_count !== 1 ? 's' : ''}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
