import { useState } from 'react';
import {
  login,
  requestLoginCode,
  confirmLoginCode,
  hasPendingFlow,
  type AllauthError,
  type AllauthResponse,
} from '../lib/allauthApi';
import SocialProviders from '../components/SocialProviders';

interface LoginProps {
  nextUrl: string;
  redirectUrl: string;
  signupUrl: string;
  forgotUrl: string;
}

type Step = 'password' | 'code' | 'verify_email';

function FieldErrors({
  param,
  errors,
}: {
  param: string;
  errors: AllauthError[];
}) {
  const msgs = errors.filter((e) => e.param === param);
  if (!msgs.length) return null;
  return (
    <ul className="mt-1 space-y-0.5">
      {msgs.map((e, i) => (
        <li key={i} className="text-xs text-ember">
          {e.message}
        </li>
      ))}
    </ul>
  );
}

function NonFieldErrors({ errors }: { errors: AllauthError[] }) {
  const msgs = errors.filter((e) => !e.param);
  if (!msgs.length) return null;
  return (
    <ul className="mb-4 space-y-1 rounded-lg border border-ember/30 bg-red-50 px-4 py-3">
      {msgs.map((e, i) => (
        <li key={i} className="text-sm text-ember">
          {e.message}
        </li>
      ))}
    </ul>
  );
}

export default function Login({
  nextUrl,
  redirectUrl,
  signupUrl,
  forgotUrl,
}: LoginProps) {
  const [step, setStep] = useState<Step>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<AllauthError[]>([]);
  const [loading, setLoading] = useState(false);

  function redirectAfterLogin() {
    window.location.href = nextUrl || redirectUrl;
  }

  function handleResponse(resp: AllauthResponse) {
    if (resp.status === 200 && resp.meta?.is_authenticated) {
      redirectAfterLogin();
      return;
    }
    if (resp.status === 401) {
      if (hasPendingFlow(resp, 'login_by_code')) {
        setErrors([]);
        setStep('code');
        return;
      }
      if (hasPendingFlow(resp, 'verify_email')) {
        setErrors([]);
        setStep('verify_email');
        return;
      }
    }
    setErrors(resp.errors ?? []);
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    try {
      handleResponse(await login(email, password));
    } finally {
      setLoading(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    try {
      handleResponse(await confirmLoginCode(code));
    } finally {
      setLoading(false);
    }
  }

  async function sendCode() {
    if (!email) {
      setErrors([{ param: 'email', message: 'Enter your email first.' }]);
      return;
    }
    setLoading(true);
    setErrors([]);
    try {
      const resp = await requestLoginCode(email);
      if (resp.status === 401 && hasPendingFlow(resp, 'login_by_code')) {
        setStep('code');
      } else {
        setErrors(
          resp.errors ?? [{ message: 'Failed to send code. Try again.' }],
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-char/20 px-3 py-2.5 text-sm text-char placeholder-smoke/60 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20';
  const labelClass = 'mb-1 block text-sm font-medium text-char/70';
  const primaryBtn =
    'w-full rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50';

  if (step === 'verify_email') {
    return (
      <main className="mx-auto max-w-md mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
        <h1 className="font-heading mb-2 text-2xl font-bold text-char">
          Check your inbox
        </h1>
        <p className="text-sm text-char/70">
          We sent a verification email to <strong>{email}</strong>. Click the
          link to confirm your address, then come back to sign in.
        </p>
      </main>
    );
  }

  if (step === 'code') {
    return (
      <main className="mx-auto max-w-md mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
        <h1 className="font-heading mb-1 text-2xl font-bold text-char">
          Enter your code
        </h1>
        <p className="mb-6 text-sm text-char/60">
          We emailed a sign-in code to <strong>{email}</strong>.
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
              placeholder="######"
              required
              className={inputClass}
            />
            <FieldErrors param="code" errors={errors} />
          </div>
          <button type="submit" disabled={loading} className={primaryBtn}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('password');
              setErrors([]);
              setCode('');
            }}
            className="w-full text-sm text-char/50 hover:text-char"
          >
            ← Back
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
      <h1 className="font-heading mb-6 text-2xl font-bold text-char">
        Sign in
      </h1>
      <form onSubmit={submitPassword} className="space-y-5">
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
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <a href={forgotUrl} className="text-xs text-smoke hover:text-char">
              Forgot password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
          />
          <FieldErrors param="password" errors={errors} />
        </div>
        <button type="submit" disabled={loading} className={primaryBtn}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="mt-4 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={sendCode}
          disabled={loading}
          className="text-sm text-smoke hover:text-char disabled:opacity-50"
        >
          Send me a sign-in code instead
        </button>
        <p className="text-sm text-char/50">
          No account?{' '}
          <a
            href={signupUrl}
            className="font-medium text-amber hover:opacity-80"
          >
            Sign up
          </a>
        </p>
      </div>
      <SocialProviders callbackUrl={nextUrl || redirectUrl} />
    </main>
  );
}
