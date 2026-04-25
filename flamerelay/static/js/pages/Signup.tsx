import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSession, type AllauthError } from '../lib/allauthApi';
import { apiFetch } from '../api';
import { FieldErrors, NonFieldErrors } from '../components/AllauthErrors';
import { inputClass, labelClass, primaryBtn } from '../styles';
import { useAuth } from '../AuthContext';
import brusselsImg from '../assets/journey/brussels.webp';

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useAuth();
  const destination = searchParams.get('next') ?? '/';

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState<AllauthError[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    getSession()
      .then((resp) => {
        if (!mounted) return;
        if (resp.meta?.is_authenticated) {
          apiFetch('/api/users/me/')
            .then((r) => r.json())
            .then((me: { username: string; name: string }) => {
              if (!mounted) return;
              setName(me.name ?? '');
              setUsername(me.username);
              setReady(true);
            })
            .catch(() => {
              if (mounted) navigate('/accounts/login/');
            });
        } else {
          navigate('/accounts/login/');
        }
      })
      .catch(() => {
        if (mounted) navigate('/accounts/login/');
      });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      const resp = await apiFetch(`/api/users/${username}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (resp.ok) {
        await refresh();
        navigate(destination, { replace: true });
      } else {
        setErrors([{ message: 'Could not save your name. Please try again.' }]);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  const previewDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <main className="mx-auto mt-16 max-w-2xl px-4">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
        {/* Form */}
        <div className="flex-1 rounded-card border border-char/10 bg-white px-8 py-10 shadow-sm">
          <h1 className="font-heading mb-2 text-2xl font-bold text-char">
            Almost there
          </h1>
          <p className="mb-6 text-sm text-char/60">
            Choose the name that&apos;ll appear on your check-ins. You can
            change this any time in settings.
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
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
        </div>

        {/* Live preview */}
        <div className="flex-1">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-smoke/60">
            Your check-ins will look like this
          </p>
          <div className="overflow-hidden rounded-card border border-char/10 bg-white shadow-sm">
            <div className="flex items-center justify-between bg-linen/60 px-4 py-3">
              <span className="font-medium text-char">Brussels</span>
              <span className="text-xs text-smoke">{previewDate}</span>
            </div>
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={brusselsImg}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col p-4">
              <p className="mb-4 text-base text-char/80">
                Had a great time, leaving tomorrow!
              </p>
              <div className="flex justify-end">
                <span
                  className="font-handwriting text-2xl text-char/60"
                  style={{ transform: 'rotate(-2deg)' }}
                >
                  {name || 'Your Name'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
