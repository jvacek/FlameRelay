import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  getAuthenticators,
  getTotpSetup,
  activateTotp,
  deactivateTotp,
  getRecoveryCodes,
  generateRecoveryCodes,
  type AllauthError,
  type Authenticator,
  type TotpAuthenticator,
  type RecoveryCodesAuthenticator,
  type TotpSetupMeta,
} from '../../lib/allauthApi';
import { inputClass, labelClass } from '../../styles';

function TotpQrCode({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      void QRCode.toCanvas(canvasRef.current, url, { width: 200, margin: 1 });
    }
  }, [url]);

  return <canvas ref={canvasRef} className="rounded-lg" />;
}

type MfaView =
  | 'overview'
  | 'totp-setup'
  | 'totp-deactivate'
  | 'recovery-codes'
  | 'recovery-codes-generate';

export default function MfaSection() {
  const [view, setView] = useState<MfaView>('overview');
  const [totp, setTotp] = useState<TotpAuthenticator | null>(null);
  const [recoveryCodes, setRecoveryCodes] =
    useState<RecoveryCodesAuthenticator | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<AllauthError[]>([]);

  const [totpMeta, setTotpMeta] = useState<TotpSetupMeta | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [busy, setBusy] = useState(false);

  const [codes, setCodes] = useState<string[]>([]);

  function loadAuthenticators() {
    return getAuthenticators().then((resp) => {
      if (resp.status === 200 && Array.isArray(resp.data)) {
        const list = resp.data as Authenticator[];
        setTotp(
          (list.find((a) => a.type === 'totp') as TotpAuthenticator) ?? null,
        );
        setRecoveryCodes(
          (list.find(
            (a) => a.type === 'recovery_codes',
          ) as RecoveryCodesAuthenticator) ?? null,
        );
      }
      setLoading(false);
    });
  }

  useEffect(() => {
    loadAuthenticators();
  }, []);

  async function startTotpSetup() {
    setErrors([]);
    setBusy(true);
    try {
      const resp = await getTotpSetup();
      // 404 = "TOTP not yet active"; allauth returns setup data in meta.
      // Double-cast needed: AllauthResponse.meta uses an index signature so
      // TypeScript can't verify TotpSetupMeta's required string fields.
      if (resp.status === 404 && resp.meta) {
        setTotpMeta(resp.meta as unknown as TotpSetupMeta);
        setTotpCode('');
        setView('totp-setup');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleActivateTotp(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setBusy(true);
    try {
      const resp = await activateTotp(totpCode);
      if (resp.status === 200) {
        setTotpCode('');
        setView('overview');
        await loadAuthenticators();
      } else {
        setErrors(resp.errors ?? [{ message: 'Invalid code. Try again.' }]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDeactivateTotp(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setBusy(true);
    try {
      const resp = await deactivateTotp(totpCode);
      if (resp.status === 200) {
        setTotpCode('');
        setView('overview');
        await loadAuthenticators();
      } else {
        setErrors(resp.errors ?? [{ message: 'Invalid code. Try again.' }]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function openRecoveryCodes() {
    setErrors([]);
    setBusy(true);
    try {
      const resp = await getRecoveryCodes();
      if (resp.status === 200 && resp.data && !Array.isArray(resp.data)) {
        const data = resp.data as unknown as { unused_codes: string[] };
        setCodes(data.unused_codes ?? []);
        setView('recovery-codes');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateCodes() {
    setErrors([]);
    setBusy(true);
    try {
      const resp = await generateRecoveryCodes();
      if (resp.status === 200 && resp.data && !Array.isArray(resp.data)) {
        const data = resp.data as unknown as { unused_codes: string[] };
        setCodes(data.unused_codes ?? []);
        await loadAuthenticators();
        setView('recovery-codes');
      } else {
        setErrors(
          resp.errors ?? [{ message: 'Failed to generate recovery codes.' }],
        );
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-char/50">Loading&hellip;</p>;

  const errorBanner = errors.length > 0 && (
    <p className="text-sm text-ember">
      {errors.map((e) => e.message).join(' ')}
    </p>
  );

  if (view === 'totp-setup' && totpMeta) {
    return (
      <div className="space-y-4">
        {errorBanner}
        <p className="text-sm text-char/70">
          Scan the QR code with your authenticator app (e.g. Google
          Authenticator, Authy), or enter the secret key manually.
        </p>
        <div className="flex justify-center">
          <TotpQrCode url={totpMeta.totp_url} />
        </div>
        <div className="rounded-lg border border-char/15 bg-linen/50 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-char/50">
            Secret key
          </p>
          <kbd className="font-mono text-sm text-char break-all">
            {totpMeta.secret}
          </kbd>
        </div>
        <form onSubmit={handleActivateTotp} className="space-y-3">
          <div>
            <label htmlFor="totp-code" className={labelClass}>
              Verification code
            </label>
            <input
              id="totp-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="123456"
              required
              className={`${inputClass} text-center tracking-widest`}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Activating\u2026' : 'Activate'}
            </button>
            <button
              type="button"
              onClick={() => {
                setView('overview');
                setErrors([]);
              }}
              className="rounded-lg border border-char/15 px-4 py-2 text-sm font-medium text-char hover:bg-linen"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (view === 'totp-deactivate') {
    return (
      <div className="space-y-4">
        {errorBanner}
        <p className="text-sm text-char/70">
          Enter a code from your authenticator app to confirm removal.
        </p>
        <form onSubmit={handleDeactivateTotp} className="space-y-3">
          <div>
            <label htmlFor="totp-deactivate-code" className={labelClass}>
              Verification code
            </label>
            <input
              id="totp-deactivate-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="123456"
              required
              className={`${inputClass} text-center tracking-widest`}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Removing\u2026' : 'Remove authenticator'}
            </button>
            <button
              type="button"
              onClick={() => {
                setView('overview');
                setErrors([]);
                setTotpCode('');
              }}
              className="rounded-lg border border-char/15 px-4 py-2 text-sm font-medium text-char hover:bg-linen"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (view === 'recovery-codes') {
    return (
      <div className="space-y-4">
        {errorBanner}
        <p className="text-sm text-char/70">
          Each code can only be used once. Store these somewhere safe.
        </p>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-char/15 bg-linen/50 p-4">
          {codes.map((c) => (
            <kbd key={c} className="font-mono text-sm text-char">
              {c}
            </kbd>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView('recovery-codes-generate')}
            className="rounded-lg border border-char/15 px-4 py-2 text-sm font-medium text-char hover:bg-linen"
          >
            Generate new codes
          </button>
          <button
            type="button"
            onClick={() => setView('overview')}
            className="text-sm text-char/50 hover:text-char"
          >
            &larr; Back
          </button>
        </div>
      </div>
    );
  }

  if (view === 'recovery-codes-generate') {
    return (
      <div className="space-y-4">
        {errorBanner}
        <div className="rounded-lg border border-ember/20 bg-ember/5 p-4">
          <p className="text-sm text-char">
            This will invalidate all existing recovery codes. Make sure you save
            the new ones.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleGenerateCodes}
            disabled={busy}
            className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Generating\u2026' : 'Generate new codes'}
          </button>
          <button
            type="button"
            onClick={() => setView('recovery-codes')}
            className="rounded-lg border border-char/15 px-4 py-2 text-sm font-medium text-char hover:bg-linen"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errorBanner}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-char">
              Authenticator app (TOTP)
            </p>
            <p className="text-xs text-char/50">
              {totp ? 'Active' : 'Not set up'}
            </p>
          </div>
          {totp ? (
            <button
              type="button"
              onClick={() => {
                setTotpCode('');
                setErrors([]);
                setView('totp-deactivate');
              }}
              className="rounded-lg border border-char/15 px-3 py-1.5 text-sm font-medium text-char hover:bg-linen"
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              onClick={startTotpSetup}
              disabled={busy}
              className="rounded-lg bg-amber px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Loading\u2026' : 'Set up'}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-char">Recovery codes</p>
            <p className="text-xs text-char/50">
              {recoveryCodes
                ? `${recoveryCodes.unused_code_count} of ${recoveryCodes.total_code_count} remaining`
                : totp
                  ? 'Not generated'
                  : 'Set up TOTP first'}
            </p>
          </div>
          {(recoveryCodes || totp) && (
            <button
              type="button"
              onClick={openRecoveryCodes}
              disabled={busy || !totp}
              className="rounded-lg border border-char/15 px-3 py-1.5 text-sm font-medium text-char hover:bg-linen disabled:opacity-40"
            >
              {busy ? 'Loading\u2026' : recoveryCodes ? 'View' : 'Generate'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
