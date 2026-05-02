import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { logout } from '../lib/allauthApi';

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

export default function UserDetail() {
  const { username, name, adminUrl, refresh } = useAuth();
  const navigate = useNavigate();
  const [subscribedUnits, setSubscribedUnits] = useState<
    SubscribedUnit[] | null
  >(null);

  useEffect(() => {
    fetch('/api/account/subscriptions/')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SubscribedUnit[] | null) => setSubscribedUnits(data ?? []))
      .catch(console.error);
  }, []);

  const displayName = name || username;

  async function handleLogout() {
    try {
      await logout();
    } finally {
      await refresh();
      navigate('/');
    }
  }

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          {adminUrl && (
            <>
              <a
                href={adminUrl}
                className="rounded-btn bg-char px-[18px] py-[7px] text-sm font-medium tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0"
              >
                Admin
              </a>
              <Link
                to="/contribute/"
                className="rounded-btn bg-char/20 px-[18px] py-[7px] text-sm font-medium tracking-wide text-char transition-transform hover:-translate-y-px active:translate-y-0"
              >
                Contributor guide
              </Link>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/profile/settings/"
            className="rounded-btn bg-amber px-[18px] py-[7px] text-sm font-medium tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0"
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-btn bg-ember px-[18px] py-[7px] text-sm font-medium tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0"
          >
            Sign out
          </button>
        </div>
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
                <Link
                  to={`/unit/${unit.identifier}/`}
                  className="flex items-center justify-between rounded-lg border border-smoke/20 bg-white px-4 py-3 hover:border-amber/60 hover:shadow-sm"
                >
                  <span className="font-heading font-semibold text-char">
                    {unit.identifier}
                  </span>
                  <span className="text-sm text-smoke">
                    {unit.checkin_count} check-in
                    {unit.checkin_count !== 1 ? 's' : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
