import { useState } from 'react';

import { apiFetch } from '../../api';
import { logout } from '../../lib/allauthApi';

export default function DeleteAccountSection() {
  const [expanded, setExpanded] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch('/api/users/me/', { method: 'DELETE' });
      if (res.ok) {
        await logout();
        window.location.replace('/accounts/login/');
      } else {
        setError('Something went wrong. Please try again.');
        setSubmitting(false);
      }
    } catch {
      setError('An unexpected error occurred.');
      setSubmitting(false);
    }
  }

  if (!expanded) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-char/70">
          Permanently remove all your personal information, messages, and
          photos. Your check-in history will be kept anonymously.
        </p>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="rounded-[4px] bg-ember px-[18px] py-[7px] text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0"
        >
          Delete my account
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-ember/20 bg-ember/5 p-4">
      {error && <p className="text-sm text-ember">{error}</p>}
      <div className="space-y-2 text-sm text-char">
        <p className="font-semibold">This will permanently:</p>
        <ul className="list-disc space-y-1 pl-5 text-char/80">
          <li>Delete your email address and sign-in methods</li>
          <li>Remove your name and profile information</li>
          <li>Delete all photos you&apos;ve uploaded to check-ins</li>
          <li>Erase all messages you&apos;ve left on check-ins</li>
          <li>Unsubscribe you from all units</li>
        </ul>
        <p className="text-char/70">
          The locations and timestamps of your check-ins will be kept
          anonymously so the relay&apos;s travel history stays intact.
        </p>
      </div>
      <p className="text-sm text-char">
        Type <strong>DELETE</strong> to confirm. This cannot be undone.
      </p>
      <input
        type="text"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        placeholder="DELETE"
        autoComplete="off"
        className="w-full rounded-lg border border-char/20 px-3 py-2.5 text-sm text-char placeholder-smoke/60 focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={confirmation !== 'DELETE' || submitting}
          className="rounded-[4px] bg-ember px-[18px] py-[7px] text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
        >
          {submitting ? 'Deleting…' : 'Confirm deletion'}
        </button>
        <button
          type="button"
          onClick={() => {
            setExpanded(false);
            setConfirmation('');
            setError(null);
          }}
          className="text-sm text-char/50 hover:text-char"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
