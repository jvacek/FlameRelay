import { useEffect, useState } from 'react';
import {
  getEmailAddresses,
  addEmail,
  deleteEmail,
  markEmailAsPrimary,
  requestEmailVerification,
  type EmailAddress,
  type AllauthError,
} from '../../lib/allauthApi';
import { inputClass, labelClass } from '../../styles';

export default function EmailSection() {
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
        <div className="rounded-card border border-amber/30 bg-amber/5 p-4 space-y-3">
          <p className="text-sm text-char">
            <strong>{readyToSwitch.email}</strong> is verified and ready to
            become your primary email.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleConfirm(readyToSwitch, primary.email)}
              disabled={busy}
              className="rounded-btn bg-amber px-[18px] py-[7px] text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
            >
              {busy ? 'Confirming\u2026' : 'Confirm change'}
            </button>
            <button
              onClick={() => handleCancel(readyToSwitch.email)}
              disabled={busy}
              className="rounded-btn border border-char/15 px-[18px] py-[7px] text-sm font-medium text-char transition-colors hover:bg-linen disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {pending && (
        <div className="rounded-card border border-char/15 bg-linen/50 p-4 space-y-3">
          <p className="text-sm text-char">
            Check your inbox at <strong>{pending.email}</strong> to verify the
            change.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleResend(pending.email)}
              disabled={busy}
              className="rounded-btn border border-char/15 px-3 py-[5px] text-sm font-medium text-char transition-colors hover:bg-linen disabled:opacity-50"
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
            className="rounded-btn bg-amber px-[18px] py-[7px] text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
          >
            {busy ? 'Requesting\u2026' : 'Change email'}
          </button>
        </form>
      )}
    </div>
  );
}
