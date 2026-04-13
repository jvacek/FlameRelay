import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import {
  getEmailAddresses,
  addEmail,
  deleteEmail,
  markEmailAsPrimary,
  requestEmailVerification,
  getConnectedAccounts,
  disconnectAccount,
  getConfig,
  redirectToProvider,
  type EmailAddress,
  type ConnectedAccount,
  type SocialProvider,
  type AllauthError,
} from '../lib/allauthApi';
import { NonFieldErrors } from '../components/AllauthErrors';

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
// Email section
// ---------------------------------------------------------------------------

function EmailSection() {
  const [addresses, setAddresses] = useState<EmailAddress[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [errors, setErrors] = useState<AllauthError[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    getEmailAddresses().then((resp) => {
      if (resp.status === 200 && Array.isArray(resp.data)) {
        setAddresses(resp.data as EmailAddress[]);
      }
    });
  }, []);

  async function withAction(key: string, fn: () => Promise<void>) {
    setActionLoading(key);
    setErrors([]);
    try {
      await fn();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await withAction('add', async () => {
      const resp = await addEmail(newEmail);
      if (resp.status === 200 && Array.isArray(resp.data)) {
        setAddresses(resp.data as EmailAddress[]);
        setNewEmail('');
      } else {
        setErrors(resp.errors ?? [{ message: 'Failed to add email.' }]);
      }
    });
  }

  const secondaryBtn =
    'rounded px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40';

  return (
    <div className="space-y-4">
      <NonFieldErrors errors={errors} />
      <ul className="divide-y divide-char/10">
        {addresses.map((addr) => (
          <li key={addr.email} className="flex items-center gap-3 py-3">
            <div className="flex-1">
              <span className="text-sm text-char">{addr.email}</span>
              <div className="mt-0.5 flex gap-2">
                {addr.primary && (
                  <span className="rounded bg-amber/15 px-1.5 py-0.5 text-xs font-medium text-amber">
                    Primary
                  </span>
                )}
                {addr.verified ? (
                  <span className="rounded bg-char/8 px-1.5 py-0.5 text-xs text-char/50">
                    Verified
                  </span>
                ) : (
                  <span className="rounded bg-ember/10 px-1.5 py-0.5 text-xs text-ember">
                    Unverified
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              {!addr.primary && addr.verified && (
                <button
                  onClick={() =>
                    withAction(`primary-${addr.email}`, async () => {
                      const resp = await markEmailAsPrimary(addr.email);
                      if (resp.status === 200 && Array.isArray(resp.data))
                        setAddresses(resp.data as EmailAddress[]);
                      else
                        setErrors(
                          resp.errors ?? [
                            { message: 'Failed to update primary email.' },
                          ],
                        );
                    })
                  }
                  disabled={actionLoading !== null}
                  className={`${secondaryBtn} bg-char/8 text-char/70`}
                >
                  Make primary
                </button>
              )}
              {!addr.verified && (
                <button
                  onClick={() =>
                    withAction(`resend-${addr.email}`, async () => {
                      const resp = await requestEmailVerification(addr.email);
                      if (resp.status !== 200)
                        setErrors(
                          resp.errors ?? [
                            { message: 'Failed to send verification email.' },
                          ],
                        );
                    })
                  }
                  disabled={actionLoading !== null}
                  className={`${secondaryBtn} bg-char/8 text-char/70`}
                >
                  {actionLoading === `resend-${addr.email}`
                    ? 'Sending\u2026'
                    : 'Resend'}
                </button>
              )}
              {!addr.primary && (
                <button
                  onClick={() =>
                    withAction(`delete-${addr.email}`, async () => {
                      const resp = await deleteEmail(addr.email);
                      if (resp.status === 200 && Array.isArray(resp.data))
                        setAddresses(resp.data as EmailAddress[]);
                      else
                        setErrors(
                          resp.errors ?? [
                            { message: 'Failed to remove email.' },
                          ],
                        );
                    })
                  }
                  disabled={actionLoading !== null}
                  className={`${secondaryBtn} bg-ember/10 text-ember`}
                >
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="new@example.com"
          required
          className="flex-1 rounded-lg border border-char/20 px-3 py-2.5 text-sm text-char placeholder-smoke/60 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
        />
        <button
          type="submit"
          disabled={actionLoading !== null}
          className="rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {actionLoading === 'add' ? 'Adding\u2026' : 'Add'}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Social accounts section
// ---------------------------------------------------------------------------

function SocialSection({ callbackUrl }: { callbackUrl: string }) {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [providers, setProviders] = useState<SocialProvider[]>([]);
  const [errors, setErrors] = useState<AllauthError[]>([]);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getConnectedAccounts(), getConfig()]).then(
      ([accountsResp, config]) => {
        if (accountsResp.status === 200 && Array.isArray(accountsResp.data)) {
          setAccounts(accountsResp.data as ConnectedAccount[]);
        }
        setProviders(config.socialaccount?.providers ?? []);
      },
    );
  }, []);

  async function handleDisconnect(account: ConnectedAccount) {
    const key = `${account.provider.id}:${account.uid}`;
    setDisconnecting(key);
    setErrors([]);
    try {
      const resp = await disconnectAccount(account.provider.id, account.uid);
      if (resp.status === 200 && Array.isArray(resp.data)) {
        setAccounts(resp.data as ConnectedAccount[]);
      } else {
        setErrors(
          resp.errors ?? [{ message: 'Failed to disconnect account.' }],
        );
      }
    } finally {
      setDisconnecting(null);
    }
  }

  const connectedIds = new Set(accounts.map((a) => a.provider.id));
  const availableToConnect = providers.filter((p) => !connectedIds.has(p.id));

  return (
    <div className="space-y-4">
      <NonFieldErrors errors={errors} />
      {accounts.length === 0 ? (
        <p className="text-sm text-char/50">No social accounts connected.</p>
      ) : (
        <ul className="divide-y divide-char/10">
          {accounts.map((account) => {
            const key = `${account.provider.id}:${account.uid}`;
            return (
              <li key={key} className="flex items-center gap-3 py-3">
                <div className="flex-1">
                  <span className="text-sm font-medium text-char">
                    {account.provider.name}
                  </span>
                  <p className="text-xs text-char/50">{account.display}</p>
                </div>
                <button
                  onClick={() => handleDisconnect(account)}
                  disabled={disconnecting !== null}
                  className="rounded px-2.5 py-1 text-xs font-medium bg-ember/10 text-ember transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                  {disconnecting === key ? 'Disconnecting\u2026' : 'Disconnect'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {availableToConnect.length > 0 && (
        <div className="flex flex-col gap-2">
          {availableToConnect.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() =>
                redirectToProvider(provider.id, callbackUrl, 'connect')
              }
              className="flex w-full items-center gap-3 rounded-lg border border-char/15 px-4 py-2.5 text-sm font-medium text-char transition-colors hover:bg-linen"
            >
              {provider.name}
            </button>
          ))}
        </div>
      )}
    </div>
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
          <EmailSection />
        </Section>
        <Section title="Connected accounts">
          <SocialSection callbackUrl={callbackUrl} />
        </Section>
      </div>
    </main>
  );
}
