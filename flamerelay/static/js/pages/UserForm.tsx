import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

interface UserFormProps {
  updateUrl: string;
  redirectUrl: string;
}

export default function UserForm({ updateUrl, redirectUrl }: UserFormProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetch('/api/users/me/')
      .then((r) => r.json())
      .then((data: { name: string }) => setName(data.name ?? ''))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const res = await apiFetch(updateUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        window.location.href = redirectUrl;
      } else {
        const body = await res.json();
        setErrors(body as Record<string, string[]>);
      }
    } catch (e) {
      console.error(e);
      setErrors({ non_field_errors: ['An unexpected error occurred.'] });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-smoke">
        Loading…
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-heading mb-8 text-3xl font-bold text-char">
        My Info
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-char"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-char/15 px-4 py-3 text-sm text-char placeholder-smoke/60 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-ember">{errors.name.join(' ')}</p>
          )}
        </div>

        {errors.non_field_errors && (
          <p className="text-sm text-ember">
            {errors.non_field_errors.join(' ')}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-amber px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Update'}
          </button>
          <a
            href={redirectUrl}
            className="rounded-lg border border-char/15 px-6 py-3 text-sm font-medium text-char hover:bg-linen"
          >
            Cancel
          </a>
        </div>
      </form>
    </main>
  );
}
