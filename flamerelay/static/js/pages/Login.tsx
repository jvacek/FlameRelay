import { useCallback, useEffect, useState } from 'react';
import {
  requestLoginCode,
  confirmLoginCode,
  mfaAuthenticate,
  getSession,
  hasPendingFlow,
  type AllauthError,
  type AllauthResponse,
} from '../lib/allauthApi';
import { apiFetch } from '../api';
import { FieldErrors, NonFieldErrors } from '../components/AllauthErrors';
import SocialProviders from '../components/SocialProviders';
import { inputClass, labelClass, primaryBtn } from '../styles';

interface LoginProps {
  nextUrl: string;
  redirectUrl: string;
}

type Step = 'email' | 'code' | 'name' | 'mfa';

interface MeData {
  username: string;
  name: string;
}

export default function Login({ nextUrl, redirectUrl }: LoginProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [errors, setErrors] = useState<AllauthError[]>([]);
  const [loading, setLoading] = useState(false);

  const destination = nextUrl || redirectUrl;

  const checkNameThenRedirect = useCallback(async () => {
    try {
      const resp = await apiFetch('/api/users/me/');
      if (resp.ok) {
        const me = (await resp.json()) as MeData;
        if (!me.name) {
          setCurrentUsername(me.username);
          setStep('name');
          return;
        }
      }
    } catch {
      // fall through to redirect
    }
    window.location.href = destination;
  }, [destination]);

  const handleAuthResponse = useCallback(
    (resp: AllauthResponse) => {
      if (resp.status === 200 && resp.meta?.is_authenticated) {
        void checkNameThenRedirect();
        return;
      }
      if (resp.status === 401) {
        if (hasPendingFlow(resp, 'mfa_authenticate')) {
          setErrors([]);
          setCode('');
          setStep('mfa');
          return;
        }
      }
      setErrors(resp.errors ?? [{ message: 'Something went wrong.' }]);
    },
    [checkNameThenRedirect],
  );

  useEffect(() => {
    const urlCode = new URLSearchParams(window.location.search).get('code');
    if (urlCode) {
      setLoading(true);
      confirmLoginCode(urlCode)
        .then((resp) => handleAuthResponse(resp))
        .catch(() => {
          setErrors([
            { message: 'Failed to verify login code. Please try again.' },
          ]);
        })
        .finally(() => setLoading(false));
      return;
    }
    getSession()
      .then((resp) => {
        if (resp.meta?.is_authenticated) {
          void checkNameThenRedirect();
        } else if (hasPendingFlow(resp, 'mfa_authenticate')) {
          setStep('mfa');
        } else if (hasPendingFlow(resp, 'login_by_code')) {
          setStep('code');
        }
      })
      .catch(() => {});
  }, [checkNameThenRedirect, handleAuthResponse]);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      const result = await requestLoginCode(email);
      if (result.ok) {
        setStep('code');
      } else {
        setErrors([
          { message: result.detail ?? 'Failed to send code. Try again.' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      handleAuthResponse(await confirmLoginCode(code));
    } finally {
      setLoading(false);
    }
  }

  async function submitMfa(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      handleAuthResponse(await mfaAuthenticate(code));
    } finally {
      setLoading(false);
    }
  }

  async function submitName(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      const resp = await apiFetch(`/api/users/${currentUsername}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (resp.ok) {
        window.location.href = destination;
      } else {
        setErrors([{ message: 'Could not save your name. Please try again.' }]);
      }
    } finally {
      setLoading(false);
    }
  }

  if (step === 'mfa') {
    return (
      <main className="mx-auto max-w-md mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
        <h1 className="font-heading mb-1 text-2xl font-bold text-char">
          Two-factor authentication
        </h1>
        <p className="mb-6 text-sm text-char/60">
          Enter the code from your authenticator app, or a recovery code.
        </p>
        <form onSubmit={submitMfa} className="space-y-5">
          <NonFieldErrors errors={errors} />
          <div>
            <label htmlFor="mfa-code" className={labelClass}>
              Authentication code
            </label>
            <input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
              className={`${inputClass} text-center tracking-widest`}
            />
            <FieldErrors param="code" errors={errors} />
          </div>
          <button type="submit" disabled={loading} className={primaryBtn}>
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </form>
      </main>
    );
  }

  if (step === 'code') {
    return (
      <main className="mx-auto max-w-md mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
        <h1 className="font-heading mb-1 text-2xl font-bold text-char">
          Check your inbox
        </h1>
        <p className="mb-6 text-sm text-char/60">
          We emailed a sign-in code to <strong>{email || 'your inbox'}</strong>.
        </p>
        <form onSubmit={submitCode} className="space-y-5">
          <NonFieldErrors errors={errors} />
          <div>
            <label htmlFor="code" className={labelClass}>
              Sign-in code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="XXXX-XXXX"
              required
              className={`${inputClass} text-center tracking-widest`}
            />
            <FieldErrors param="code" errors={errors} />
          </div>
          <button type="submit" disabled={loading} className={primaryBtn}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('email');
              setCode('');
              setErrors([]);
            }}
            className="w-full text-sm text-char/50 hover:text-char"
          >
            ← Use a different email
          </button>
        </form>
      </main>
    );
  }

  if (step === 'name') {
    return (
      <main className="mx-auto max-w-md mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
        <h1 className="font-heading mb-2 text-2xl font-bold text-char">
          One last thing
        </h1>
        <p className="mb-6 text-sm text-char/60">
          What should we call you? This name appears on your check-ins and can
          be changed any time in settings.
        </p>
        <form onSubmit={submitName} className="space-y-5">
          <NonFieldErrors errors={errors} />
          <div>
            <label htmlFor="name" className={labelClass}>
              Display name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
            />
            <FieldErrors param="name" errors={errors} />
          </div>
          <button type="submit" disabled={loading} className={primaryBtn}>
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
      <h1 className="font-heading mb-2 text-2xl font-bold text-char">
        Sign in or sign up
      </h1>
      <p className="mb-6 text-sm text-char/60">
        Enter your email and we&apos;ll send you a one-time code — no password
        needed.
      </p>
      <form onSubmit={sendCode} className="space-y-5">
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
          {loading ? 'Sending code…' : 'Continue with email'}
        </button>
      </form>
      <SocialProviders callbackUrl="/accounts/login/" />
    </main>
  );
}
