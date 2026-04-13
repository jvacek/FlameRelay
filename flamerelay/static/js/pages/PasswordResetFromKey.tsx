import { useState, useEffect } from 'react';
import {
  getPasswordReset,
  resetPassword,
  type AllauthError,
} from '../lib/allauthApi';
import { FieldErrors, NonFieldErrors } from '../components/AllauthErrors';

interface PasswordResetFromKeyProps {
  resetKey: string;
  tokenFail: boolean;
  loginUrl: string;
  passwordResetUrl: string;
}

type Step = 'loading' | 'form' | 'invalid';

export default function PasswordResetFromKey({
  resetKey,
  tokenFail,
  loginUrl,
  passwordResetUrl,
}: PasswordResetFromKeyProps) {
  const [step, setStep] = useState<Step>(
    tokenFail || !resetKey ? 'invalid' : 'loading',
  );
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [errors, setErrors] = useState<AllauthError[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tokenFail || !resetKey) return;
    getPasswordReset(resetKey).then((resp) => {
      if (resp.status === 200) {
        setStep('form');
      } else {
        setErrors(resp.errors ?? []);
        setStep('invalid');
      }
    });
  }, [resetKey, tokenFail]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password1 !== password2) {
      setErrors([{ param: 'password2', message: 'Passwords do not match.' }]);
      return;
    }
    setLoading(true);
    setErrors([]);
    try {
      const resp = await resetPassword(resetKey, password1);
      if (resp.status === 200 || resp.status === 401) {
        window.location.href = loginUrl;
        return;
      }
      setErrors(
        resp.errors ?? [{ message: 'Something went wrong. Please try again.' }],
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-char/20 px-3 py-2.5 text-sm text-char placeholder-smoke/60 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20';
  const labelClass = 'mb-1 block text-sm font-medium text-char/70';
  const primaryBtn =
    'w-full rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50';

  if (step === 'loading') {
    return (
      <main className="mx-auto max-w-md mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
        <p className="text-sm text-char/60">Checking your reset link…</p>
      </main>
    );
  }

  if (step === 'invalid') {
    return (
      <main className="mx-auto max-w-md mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
        <h1 className="font-heading mb-2 text-2xl font-bold text-char">
          Invalid link
        </h1>
        <p className="text-sm text-char/70">
          This password reset link is invalid or has expired.{' '}
          <a
            href={passwordResetUrl}
            className="font-medium text-amber hover:opacity-80"
          >
            Request a new one
          </a>
          .
        </p>
        {errors.length > 0 && <NonFieldErrors errors={errors} />}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
      <h1 className="font-heading mb-6 text-2xl font-bold text-char">
        Set new password
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <NonFieldErrors errors={errors} />
        <div>
          <label htmlFor="password1" className={labelClass}>
            New password
          </label>
          <input
            id="password1"
            type="password"
            autoComplete="new-password"
            value={password1}
            onChange={(e) => setPassword1(e.target.value)}
            required
            className={inputClass}
          />
          <FieldErrors param="password" errors={errors} />
        </div>
        <div>
          <label htmlFor="password2" className={labelClass}>
            Confirm new password
          </label>
          <input
            id="password2"
            type="password"
            autoComplete="new-password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
            className={inputClass}
          />
          <FieldErrors param="password2" errors={errors} />
        </div>
        <button type="submit" disabled={loading} className={primaryBtn}>
          {loading ? 'Saving…' : 'Set new password'}
        </button>
      </form>
    </main>
  );
}
