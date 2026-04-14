import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import {
  getEmailAddresses,
  addEmail,
  deleteEmail,
  markEmailAsPrimary,
  requestEmailVerification,
  type EmailAddress,
  type AllauthError,
} from '../lib/allauthApi';
import SocialAccountManager from '../components/SocialAccountManager';
import { inputClass, labelClass } from '../styles';

interface UserSettingsProps {
  updateUrl: string;
  passwordUrl: string;
  mfaUrl: string;
  callbackUrl: string;
}

// ---------------------------------------------------------------------------
// Email change section
// ---------------------------------------------------------------------------

function EmailChangeSection() {
  const [addresses, setAddresses] = useState<EmailAddress[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [errors, setErrors] = useState<AllauthError[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  function reload() {
    return getEmailAddresses().then((resp) => {
      if (resp.status === 200 && Array.isArray(resp.data)) {
        setAddresses(resp.data as EmailAddress[]);
      }
      setLoading(false);
    });
  }

  useEffect(() => {
    reload();
  }, []);

  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setErrors([]);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    await act(async () => {
      const resp = await addEmail(newEmail);
      if (resp.status === 200 && Array.isArray(resp.data)) {
        setAddresses(resp.data as EmailAddress[]);
        setNewEmail('');
      } else {
        setErrors(
          resp.errors ?? [{ message: 'Failed to request email change.' }],
        );
      }
    });
  }

  async function handleResend(email: string) {
    await act(async () => {
      const resp = await requestEmailVerification(email);
      if (resp.status !== 200) {
        setErrors(
          resp.errors ?? [{ message: 'Failed to send verification email.' }],
        );
      }
    });
  }

  async function handleConfirm(newAddr: EmailAddress, oldEmail: string) {
    await act(async () => {
      const r1 = await markEmailAsPrimary(newAddr.email);
      if (r1.status !== 200) {
        setErrors(r1.errors ?? [{ message: 'Failed to set primary email.' }]);
        return;
      }
      const r2 = await deleteEmail(oldEmail);
      if (r2.status === 200 && Array.isArray(r2.data)) {
        setAddresses(r2.data as EmailAddress[]);
      } else {
        setErrors(r2.errors ?? [{ message: 'Failed to remove old email.' }]);
        await reload();
      }
    });
  }

  async function handleCancel(email: string) {
    await act(async () => {
      const resp = await deleteEmail(email);
      if (resp.status === 200 && Array.isArray(resp.data)) {
        setAddresses(resp.data as EmailAddress[]);
      } else {
        setErrors(
          resp.errors ?? [{ message: 'Failed to cancel email change.' }],
        );
      }
    });
  }

  if (loading) return <p className="text-sm text-char/50">Loading&hellip;</p>;

  const primary = addresses.find((a) => a.primary);
  const pending = addresses.find((a) => !a.primary && !a.verified);
  const readyToSwitch = addresses.find((a) => !a.primary && a.verified);

  return (
    <div className="space-y-4">
      {errors.length > 0 && (
        <p className="text-sm text-ember">
          {errors.map((e) => e.message).join(' ')}
        </p>
      )}

      {primary && (
        <div>
          <p className="mb-1 text-sm font-medium text-char/70">Current email</p>
          <p className="text-sm text-char">{primary.email}</p>
        </div>
      )}

      {readyToSwitch && primary && (
        <div className="rounded-lg border border-amber/30 bg-amber/5 p-4 space-y-3">
          <p className="text-sm text-char">
            <strong>{readyToSwitch.email}</strong> is verified and ready to
            become your primary email.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleConfirm(readyToSwitch, primary.email)}
              disabled={busy}
              className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Confirming\u2026' : 'Confirm change'}
            </button>
            <button
              onClick={() => handleCancel(readyToSwitch.email)}
              disabled={busy}
              className="rounded-lg border border-char/15 px-4 py-2 text-sm font-medium text-char hover:bg-linen disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {pending && (
        <div className="rounded-lg border border-char/15 bg-linen/50 p-4 space-y-3">
          <p className="text-sm text-char">
            Check your inbox at <strong>{pending.email}</strong> to verify the
            change.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleResend(pending.email)}
              disabled={busy}
              className="rounded-lg border border-char/15 px-3 py-1.5 text-sm font-medium text-char hover:bg-linen disabled:opacity-50"
            >
              {busy ? 'Sending\u2026' : 'Resend email'}
            </button>
            <button
              onClick={() => handleCancel(pending.email)}
              disabled={busy}
              className="text-sm text-char/50 hover:text-char disabled:opacity-50"
            >
              Cancel change
            </button>
          </div>
        </div>
      )}

      {!pending && !readyToSwitch && (
        <form onSubmit={handleChange} className="space-y-3">
          <div>
            <label htmlFor="new-email" className={labelClass}>
              New email address
            </label>
            <input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@example.com"
              required
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Requesting\u2026' : 'Change email'}
          </button>
        </form>
      )}
    </div>
  );
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
        <Section title="Email address">
          <EmailChangeSection />
        </Section>
        <Section title="Connected accounts">
          <SocialAccountManager callbackUrl={callbackUrl} />
        </Section>
      </div>
    </main>
  );
}
