import { useState, useEffect } from 'react';
import {
  getEmailAddresses,
  addEmail,
  deleteEmail,
  markEmailAsPrimary,
  requestEmailVerification,
  type EmailAddress,
  type AllauthError,
} from '../lib/allauthApi';
import { NonFieldErrors } from '../components/AllauthErrors';

interface EmailManageProps {
  loginUrl: string;
}

export default function EmailManage({ loginUrl }: EmailManageProps) {
  const [addresses, setAddresses] = useState<EmailAddress[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [errors, setErrors] = useState<AllauthError[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    getEmailAddresses().then((resp) => {
      if (resp.status === 200 && Array.isArray(resp.data)) {
        setAddresses(resp.data as EmailAddress[]);
      } else if (resp.status === 401) {
        window.location.href = loginUrl;
      }
      setLoading(false);
    });
  }, [loginUrl]);

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

  async function handleDelete(email: string) {
    await withAction(`delete-${email}`, async () => {
      const resp = await deleteEmail(email);
      if (resp.status === 200 && Array.isArray(resp.data)) {
        setAddresses(resp.data as EmailAddress[]);
      } else {
        setErrors(resp.errors ?? [{ message: 'Failed to remove email.' }]);
      }
    });
  }

  async function handleMakePrimary(email: string) {
    await withAction(`primary-${email}`, async () => {
      const resp = await markEmailAsPrimary(email);
      if (resp.status === 200 && Array.isArray(resp.data)) {
        setAddresses(resp.data as EmailAddress[]);
      } else {
        setErrors(
          resp.errors ?? [{ message: 'Failed to update primary email.' }],
        );
      }
    });
  }

  async function handleResend(email: string) {
    await withAction(`resend-${email}`, async () => {
      const resp = await requestEmailVerification(email);
      if (resp.status !== 200) {
        setErrors(
          resp.errors ?? [{ message: 'Failed to send verification email.' }],
        );
      }
    });
  }

  const inputClass =
    'flex-1 rounded-lg border border-char/20 px-3 py-2.5 text-sm text-char placeholder-smoke/60 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20';
  const secondaryBtn =
    'rounded px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40';

  if (loading) {
    return (
      <main className="mx-auto max-w-xl mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
        <p className="text-sm text-char/60">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
      <h1 className="font-heading mb-6 text-2xl font-bold text-char">
        Email addresses
      </h1>
      <NonFieldErrors errors={errors} />
      <ul className="mb-8 divide-y divide-char/10">
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
                  onClick={() => handleMakePrimary(addr.email)}
                  disabled={actionLoading !== null}
                  className={`${secondaryBtn} bg-char/8 text-char/70`}
                >
                  Make primary
                </button>
              )}
              {!addr.verified && (
                <button
                  onClick={() => handleResend(addr.email)}
                  disabled={actionLoading !== null}
                  className={`${secondaryBtn} bg-char/8 text-char/70`}
                >
                  {actionLoading === `resend-${addr.email}`
                    ? 'Sending…'
                    : 'Resend'}
                </button>
              )}
              {!addr.primary && (
                <button
                  onClick={() => handleDelete(addr.email)}
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
      <h2 className="mb-3 text-sm font-semibold text-char/70 uppercase tracking-wide">
        Add email address
      </h2>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="new@example.com"
          required
          className={inputClass}
        />
        <button
          type="submit"
          disabled={actionLoading !== null}
          className="rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {actionLoading === 'add' ? 'Adding…' : 'Add'}
        </button>
      </form>
    </main>
  );
}
