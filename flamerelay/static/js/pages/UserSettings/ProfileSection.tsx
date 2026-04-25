import { useEffect, useState } from 'react';
import { apiFetch } from '../../api';
import { inputClass } from '../../styles';

export default function ProfileSection({ updateUrl }: { updateUrl: string }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    apiFetch('/api/users/me/')
      .then((r) => r.json())
      .then((data: { name: string }) => setName(data.name ?? ''))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setSaved(false);
    try {
      const res = await apiFetch(updateUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setSaved(true);
      } else {
        const body = (await res.json()) as Record<string, string[]>;
        setErrors(body);
      }
    } catch {
      setErrors({ non_field_errors: ['An unexpected error occurred.'] });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-char/50">Loading&hellip;</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-char/70"
        >
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className={inputClass}
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
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-btn bg-amber px-[18px] py-[7px] text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
        >
          {submitting ? 'Saving\u2026' : 'Save'}
        </button>
        {saved && <span className="text-sm text-char/50">Saved.</span>}
      </div>
    </form>
  );
}
