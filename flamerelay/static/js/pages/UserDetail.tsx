import { useEffect, useState } from 'react';

interface UserDetailProps {
  username: string;
  currentUsername: string;
  settingsUrl: string;
}

interface UserData {
  username: string;
  name: string;
}

export default function UserDetail({
  username,
  currentUsername,
  settingsUrl,
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
            href={settingsUrl}
            className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Settings
          </a>
        </div>
      )}
    </main>
  );
}
