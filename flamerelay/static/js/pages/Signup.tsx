import { useEffect, useState } from 'react';
import { getSession, type AllauthError } from '../lib/allauthApi';
import { apiFetch } from '../api';
import { FieldErrors, NonFieldErrors } from '../components/AllauthErrors';
import { inputClass, labelClass, primaryBtn } from '../styles';

interface SignupProps {
  loginUrl: string;
  redirectUrl: string;
}

export default function Signup({ loginUrl, redirectUrl }: SignupProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState<AllauthError[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    getSession()
      .then((resp) => {
        if (!mounted) return;
        if (resp.meta?.is_authenticated) {
          apiFetch('/api/users/me/')
            .then((r) => r.json())
            .then((me: { username: string; name: string }) => {
              if (!mounted) return;
              setName(me.name ?? '');
              setUsername(me.username);
              setReady(true);
            })
            .catch(() => {
              if (mounted) window.location.href = loginUrl;
            });
        } else {
          window.location.href = loginUrl;
        }
      })
      .catch(() => {
        if (mounted) window.location.href = loginUrl;
      });
    return () => {
      mounted = false;
    };
  }, [loginUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      const resp = await apiFetch(`/api/users/${username}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (resp.ok) {
        window.location.href = redirectUrl;
      } else {
        setErrors([{ message: 'Could not save your name. Please try again.' }]);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-md mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
      <h1 className="font-heading mb-2 text-2xl font-bold text-char">
        Almost there
      </h1>
      <p className="mb-6 text-sm text-char/60">
        Choose the name that&apos;ll appear on your check-ins. You can change
        this any time in settings.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <NonFieldErrors errors={errors} />
        <div>
          <label htmlFor="name" className={labelClass}>
            Display name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
          <FieldErrors param="name" errors={errors} />
        </div>
        <button type="submit" disabled={loading} className={primaryBtn}>
          {loading ? 'Saving\u2026' : 'Continue'}
        </button>
      </form>
    </main>
  );
}
