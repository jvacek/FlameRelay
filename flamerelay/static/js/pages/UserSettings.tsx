import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import EmailAddressManager from '../components/EmailAddressManager';
import SocialAccountManager from '../components/SocialAccountManager';

interface UserSettingsProps {
  updateUrl: string;
  passwordUrl: string;
  mfaUrl: string;
  callbackUrl: string;
}

// ---------------------------------------------------------------------------
// Profile section
// ---------------------------------------------------------------------------

function ProfileSection({ updateUrl }: { updateUrl: string }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
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
          className="w-full rounded-lg border border-char/20 px-3 py-2.5 text-sm text-char placeholder-smoke/60 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
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
          className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Saving\u2026' : 'Save'}
        </button>
        {saved && <span className="text-sm text-char/50">Saved.</span>}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-char/10 pt-8">
      <h2 className="font-heading mb-5 text-lg font-semibold text-char">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function UserSettings({
  updateUrl,
  passwordUrl,
  mfaUrl,
  callbackUrl,
}: UserSettingsProps) {
  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold text-char">Settings</h1>
        <div className="flex gap-2">
          <a
            href={passwordUrl}
            className="rounded-lg border border-char/15 px-3 py-2 text-sm font-medium text-char hover:bg-linen"
          >
            Change Password
          </a>
          <a
            href={mfaUrl}
            className="rounded-lg border border-char/15 px-3 py-2 text-sm font-medium text-char hover:bg-linen"
          >
            MFA
          </a>
        </div>
      </div>

      <div className="space-y-8">
        <Section title="Profile">
          <ProfileSection updateUrl={updateUrl} />
        </Section>
        <Section title="Email addresses">
          <EmailAddressManager />
        </Section>
        <Section title="Connected accounts">
          <SocialAccountManager callbackUrl={callbackUrl} />
        </Section>
      </div>
    </main>
  );
}
