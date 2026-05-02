import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  getAuthenticators,
  getSession,
  getTotpSetup,
  activateTotp,
  deactivateTotp,
  getRecoveryCodes,
  generateRecoveryCodes,
  reauthenticateWithCode,
  reauthenticateWithPassword,
  requestLoginCode,
  type AllauthError,
  type AllauthResponse,
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
  | 'recovery-codes-generate'
  | 'reauth';

function needsReauth(resp: AllauthResponse): boolean {
  if (resp.status !== 401 || !resp.data || Array.isArray(resp.data))
    return false;
  return resp.data.flows?.some((f) => f.id === 'reauthenticate') ?? false;
}

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

  const [reauthEmail, setReauthEmail] = useState('');
  const [reauthHasPassword, setReauthHasPassword] = useState(false);
  const [reauthCode, setReauthCode] = useState('');
  const [reauthCodeSent, setReauthCodeSent] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [pendingView, setPendingView] = useState<
    'totp-setup' | 'totp-deactivate' | null
  >(null);

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
      const [totpResp, sessionResp] = await Promise.all([
        getTotpSetup(),
        getSession(),
      ]);

      // 404 = "TOTP not yet active"; allauth returns setup data in meta.
      // Double-cast needed: AllauthResponse.meta uses an index signature so
      // TypeScript can't verify TotpSetupMeta's required string fields.
      if (totpResp.status !== 404 || !totpResp.meta) return;

      setTotpMeta(totpResp.meta as unknown as TotpSetupMeta);
      setTotpCode('');

      // Detect upfront whether reauthentication will be required so the user
      // only has to enter the TOTP code once. Allauth requires reauth when the
      // user has a usable password and authenticated more than 300 s ago.
      if (
        sessionResp.status === 200 &&
        sessionResp.data &&
        !Array.isArray(sessionResp.data)
      ) {
        type SessionData = {
          user?: { email?: string; has_usable_password?: boolean };
          methods?: Array<{ at?: number }>;
        };
        const sd = sessionResp.data as unknown as SessionData;
        const hasPassword = sd.user?.has_usable_password === true;
        const methods = sd.methods ?? [];
        const lastAt = methods[methods.length - 1]?.at ?? 0;
        const stale = Date.now() / 1000 - lastAt > 300;

        if (hasPassword && stale) {
          setReauthEmail(sd.user?.email ?? '');
          setReauthHasPassword(true);
          setReauthCode('');
          setReauthCodeSent(false);
          setReauthPassword('');
          setPendingView('totp-setup');
          setErrors([]);
          setView('reauth');
          return;
        }
      }

      setView('totp-setup');
    } finally {
      setBusy(false);
    }
  }

  function enterReauth(
    resp: AllauthResponse,
    pending: 'totp-setup' | 'totp-deactivate',
  ) {
    const data = resp.data as
      | { user?: { email?: string; has_usable_password?: boolean } }
      | undefined;
    setReauthEmail((data?.user?.email as string | undefined) ?? '');
    setReauthHasPassword(data?.user?.has_usable_password === true);
    setReauthCode('');
    setReauthCodeSent(false);
    setReauthPassword('');
    setPendingView(pending);
    setErrors([]);
    setView('reauth');
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
      } else if (needsReauth(resp)) {
        enterReauth(resp, 'totp-setup');
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
      } else if (needsReauth(resp)) {
        enterReauth(resp, 'totp-deactivate');
      } else {
        setErrors(resp.errors ?? [{ message: 'Invalid code. Try again.' }]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSendReauthCode() {
    setErrors([]);
    setBusy(true);
    try {
      const result = await requestLoginCode(reauthEmail);
      if (result.ok) {
        setReauthCodeSent(true);
      } else {
        setErrors([
          { message: result.detail ?? 'Failed to send verification code.' },
        ]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleReauthByCode(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setBusy(true);
    try {
      const resp = await reauthenticateWithCode(reauthCode);
      if (resp.status === 200) {
        setReauthCode('');
        setView(pendingView ?? 'overview');
      } else {
        setErrors(
          resp.errors ?? [{ message: 'Invalid code. Please try again.' }],
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleReauthByPassword(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setBusy(true);
    try {
      const resp = await reauthenticateWithPassword(reauthPassword);
      if (resp.status === 200) {
        setReauthPassword('');
        setView(pendingView ?? 'overview');
      } else {
        setErrors(
          resp.errors ?? [{ message: 'Incorrect password. Please try again.' }],
        );
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

  if (view === 'reauth') {
    const cancelReauth = () => {
      setView('overview');
      setErrors([]);
    };

    return (
      <div className="space-y-4">
        {errorBanner}
        <p className="text-sm text-char/70">
          For security, confirm your identity before changing two-factor
          authentication settings.
        </p>
        {reauthHasPassword ? (
          <form onSubmit={handleReauthByPassword} className="space-y-3">
            <div>
              <label htmlFor="reauth-password" className={labelClass}>
                Password
              </label>
              <input
                id="reauth-password"
                type="password"
                autoComplete="current-password"
                value={reauthPassword}
                onChange={(e) => setReauthPassword(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-btn bg-amber px-[18px] py-[7px] text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
              >
                {busy ? 'Confirming…' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={cancelReauth}
                className="rounded-btn border border-char/15 px-[18px] py-[7px] text-sm font-medium text-char transition-colors hover:bg-linen"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : !reauthCodeSent ? (
          <>
            <button
              type="button"
              onClick={handleSendReauthCode}
              disabled={busy}
              className="rounded-btn bg-amber px-[18px] py-[7px] text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
            >
              {busy ? 'Sending…' : `Send code to ${reauthEmail}`}
            </button>
            <button
              type="button"
              onClick={cancelReauth}
              className="block text-sm text-char/50 hover:text-char"
            >
              Cancel
            </button>
          </>
        ) : (
          <form onSubmit={handleReauthByCode} className="space-y-3">
            <p className="text-sm text-char/70">
              A verification code was sent to {reauthEmail}.
            </p>
            <div>
              <label htmlFor="reauth-code" className={labelClass}>
                Verification code
              </label>
              <input
                id="reauth-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={reauthCode}
                onChange={(e) => setReauthCode(e.target.value)}
                placeholder="123456"
                required
                className={`${inputClass} text-center tracking-widest`}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-btn bg-amber px-[18px] py-[7px] text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
              >
                {busy ? 'Confirming…' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={cancelReauth}
                className="rounded-btn border border-char/15 px-[18px] py-[7px] text-sm font-medium text-char transition-colors hover:bg-linen"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

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
        <div className="rounded-card border border-char/15 bg-linen/50 p-4">
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
              className="rounded-btn bg-amber px-[18px] py-[7px] text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
            >
              {busy ? 'Activating…' : 'Activate'}
            </button>
            <button
              type="button"
              onClick={() => {
                setView('overview');
                setErrors([]);
              }}
              className="rounded-btn border border-char/15 px-[18px] py-[7px] text-sm font-medium text-char transition-colors hover:bg-linen"
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
              className="rounded-btn bg-ember px-[18px] py-[7px] text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
            >
              {busy ? 'Removing…' : 'Remove authenticator'}
            </button>
            <button
              type="button"
              onClick={() => {
                setView('overview');
                setErrors([]);
                setTotpCode('');
              }}
              className="rounded-btn border border-char/15 px-[18px] py-[7px] text-sm font-medium text-char transition-colors hover:bg-linen"
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
            className="rounded-btn border border-char/15 px-[18px] py-[7px] text-sm font-medium text-char transition-colors hover:bg-linen"
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
        <div className="rounded-card border border-ember/20 bg-ember/5 p-4">
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
            className="rounded-btn bg-ember px-[18px] py-[7px] text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
          >
            {busy ? 'Generating…' : 'Generate new codes'}
          </button>
          <button
            type="button"
            onClick={() => setView('recovery-codes')}
            className="rounded-btn border border-char/15 px-[18px] py-[7px] text-sm font-medium text-char transition-colors hover:bg-linen"
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
              className="rounded-btn border border-char/15 px-3 py-[5px] text-sm font-medium text-char transition-colors hover:bg-linen"
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              onClick={startTotpSetup}
              disabled={busy}
              className="rounded-btn bg-amber px-3 py-[5px] text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
            >
              {busy ? 'Loading…' : 'Set up'}
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
              className="rounded-btn border border-char/15 px-3 py-[5px] text-sm font-medium text-char transition-colors hover:bg-linen disabled:opacity-40"
            >
              {busy ? 'Loading…' : recoveryCodes ? 'View' : 'Generate'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
