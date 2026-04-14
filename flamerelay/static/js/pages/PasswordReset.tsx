import { useState } from 'react';
import { requestPasswordReset, type AllauthError } from '../lib/allauthApi';
import { FieldErrors, NonFieldErrors } from '../components/AllauthErrors';
import { inputClass, labelClass, primaryBtn } from '../styles';

interface PasswordResetProps {
  loginUrl: string;
}

export default function PasswordReset({ loginUrl }: PasswordResetProps) {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<AllauthError[]>([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    try {
      const resp = await requestPasswordReset(email);
      if (resp.status === 200) {
        setSent(true);
        return;
      }
      setErrors(
        resp.errors ?? [{ message: 'Something went wrong. Please try again.' }],
      );
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="mx-auto max-w-md mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
        <h1 className="font-heading mb-2 text-2xl font-bold text-char">
          Check your inbox
        </h1>
        <p className="text-sm text-char/70">
          If an account exists for <strong>{email}</strong>, we sent a link to
          reset your password.{' '}
          <a
            href={loginUrl}
            className="font-medium text-amber hover:opacity-80"
          >
            Back to sign in
          </a>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
      <h1 className="font-heading mb-2 text-2xl font-bold text-char">
        Reset your password
      </h1>
      <p className="mb-6 text-sm text-char/60">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <NonFieldErrors errors={errors} />
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
          <FieldErrors param="email" errors={errors} />
        </div>
        <button type="submit" disabled={loading} className={primaryBtn}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-char/50">
        <a href={loginUrl} className="font-medium text-amber hover:opacity-80">
          Back to sign in
        </a>
      </p>
    </main>
  );
}
