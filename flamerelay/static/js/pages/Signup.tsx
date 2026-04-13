import { useState } from 'react';
import { signUp, hasPendingFlow, type AllauthError } from '../lib/allauthApi';
import SocialProviders from '../components/SocialProviders';

interface SignupProps {
  loginUrl: string;
}

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

export default function Signup({ loginUrl }: SignupProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [errors, setErrors] = useState<AllauthError[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifyPending, setVerifyPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password1 !== password2) {
      setErrors([{ param: 'password2', message: 'Passwords do not match.' }]);
      return;
    }
    setErrors([]);
    setLoading(true);
    try {
      const resp = await signUp({ email, username, password1, password2 });
      if (resp.status === 200 && resp.meta?.is_authenticated) {
        window.location.href = '/users/redirect/';
        return;
      }
      if (resp.status === 401 && hasPendingFlow(resp, 'verify_email')) {
        setVerifyPending(true);
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

  if (verifyPending) {
    return (
      <main className="mx-auto max-w-md mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
        <h1 className="font-heading mb-2 text-2xl font-bold text-char">
          Check your inbox
        </h1>
        <p className="text-sm text-char/70">
          We sent a verification email to <strong>{email}</strong>. Click the
          link to confirm your address, then{' '}
          <a
            href={loginUrl}
            className="font-medium text-amber hover:opacity-80"
          >
            sign in
          </a>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
      <h1 className="font-heading mb-6 text-2xl font-bold text-char">
        Create an account
      </h1>
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
        <div>
          <label htmlFor="username" className={labelClass}>
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className={inputClass}
          />
          <FieldErrors param="username" errors={errors} />
        </div>
        <div>
          <label htmlFor="password1" className={labelClass}>
            Password
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
          <FieldErrors param="password1" errors={errors} />
        </div>
        <div>
          <label htmlFor="password2" className={labelClass}>
            Confirm password
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
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-char/50">
        Already have an account?{' '}
        <a href={loginUrl} className="font-medium text-amber hover:opacity-80">
          Sign in
        </a>
      </p>
      <SocialProviders callbackUrl="/users/redirect/" />
    </main>
  );
}
