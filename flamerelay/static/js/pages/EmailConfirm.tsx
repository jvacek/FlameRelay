import { useState, useEffect } from 'react';
import {
  getEmailVerification,
  verifyEmail,
  type AllauthError,
} from '../lib/allauthApi';
import { NonFieldErrors } from '../components/AllauthErrors';
import { primaryBtn } from '../styles';

interface EmailConfirmProps {
  verificationKey: string;
  loginUrl: string;
  emailUrl: string;
}

type Step = 'loading' | 'confirm' | 'invalid' | 'done';

export default function EmailConfirm({
  verificationKey,
  loginUrl,
  emailUrl,
}: EmailConfirmProps) {
  const [step, setStep] = useState<Step>(
    verificationKey ? 'loading' : 'invalid',
  );
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<AllauthError[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!verificationKey) return;
    getEmailVerification(verificationKey).then((resp) => {
      if (
        resp.status === 200 &&
        resp.data &&
        !Array.isArray(resp.data) &&
        resp.data.email
      ) {
        setEmail(resp.data.email as string);
        setStep('confirm');
      } else {
        setErrors(resp.errors ?? []);
        setStep('invalid');
      }
    });
  }, [verificationKey]);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    try {
      const resp = await verifyEmail(verificationKey);
      if (resp.status === 200 || resp.status === 401) {
        window.location.href = loginUrl;
        return;
      }
      setErrors(
        resp.errors ?? [{ message: 'Verification failed. Please try again.' }],
      );
    } finally {
      setLoading(false);
    }
  }

  if (step === 'loading') {
    return (
      <main className="mx-auto max-w-md mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
        <p className="text-sm text-char/60">Checking your verification link…</p>
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
          This email confirmation link is invalid or has expired.{' '}
          <a
            href={emailUrl}
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
      <h1 className="font-heading mb-2 text-2xl font-bold text-char">
        Confirm your email
      </h1>
      <p className="mb-6 text-sm text-char/70">
        Confirm <strong>{email}</strong> as your email address.
      </p>
      <form onSubmit={handleConfirm} className="space-y-5">
        <NonFieldErrors errors={errors} />
        <button type="submit" disabled={loading} className={primaryBtn}>
          {loading ? 'Confirming…' : 'Confirm email address'}
        </button>
      </form>
    </main>
  );
}
