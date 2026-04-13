import { useEffect, useState } from 'react';

interface UserDetailProps {
  username: string;
  currentUsername: string;
  updateUrl: string;
  emailUrl: string;
  passwordUrl: string;
  socialUrl: string;
  mfaUrl: string;
}

interface UserData {
  username: string;
  name: string;
}

export default function UserDetail({
  username,
  currentUsername,
  updateUrl,
  emailUrl,
  passwordUrl,
  socialUrl,
  mfaUrl,
}: UserDetailProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const isOwnProfile = username === currentUsername;

  useEffect(() => {
    fetch(`/api/users/${username}/`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: UserData | null) => setUser(data))
      .catch(console.error);
  }, [username]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-heading mb-2 text-3xl font-bold text-char">
        {username}
      </h1>
      {user?.name && <p className="mb-6 text-smoke">{user.name}</p>}

      {isOwnProfile && (
        <div className="flex flex-wrap gap-3">
          <a
            href={updateUrl}
            className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            My Info
          </a>
          <a
            href={emailUrl}
            className="rounded-lg border border-char/15 px-4 py-2 text-sm font-medium text-char hover:bg-linen"
          >
            E-Mail
          </a>
          <a
            href={passwordUrl}
            className="rounded-lg border border-char/15 px-4 py-2 text-sm font-medium text-char hover:bg-linen"
          >
            Change Password
          </a>
          <a
            href={socialUrl}
            className="rounded-lg border border-char/15 px-4 py-2 text-sm font-medium text-char hover:bg-linen"
          >
            Connected Accounts
          </a>
          <a
            href={mfaUrl}
            className="rounded-lg border border-char/15 px-4 py-2 text-sm font-medium text-char hover:bg-linen"
          >
            MFA
          </a>
        </div>
      )}
    </main>
  );
}
