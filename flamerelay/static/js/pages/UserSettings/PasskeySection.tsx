import { useEffect, useState } from 'react';
import {
  startRegistration,
  browserSupportsWebAuthn,
  type PublicKeyCredentialCreationOptionsJSON,
} from '@simplewebauthn/browser';
import {
  getPasskeys,
  beginPasskeyRegistration,
  completePasskeyRegistration,
  deletePasskey,
  reauthenticateWithCode,
  reauthenticateWithPassword,
  requestLoginCode,
  type AllauthError,
  type AllauthResponse,
  type WebAuthnPasskey,
} from '../../lib/allauthApi';
import { NonFieldErrors } from '../../components/AllauthErrors';
import {
  inputClass,
  labelClass,
  outlineBtnMd,
  outlineBtnSm,
  primaryBtnMd,
} from '../../styles';

type PasskeyView = 'list' | 'adding' | 'reauth';

function needsReauth(resp: AllauthResponse): boolean {
  if (resp.status !== 401 || !resp.data || Array.isArray(resp.data))
    return false;
  return resp.data.flows?.some((f) => f.id === 'reauthenticate') ?? false;
}

export default function PasskeySection() {
  const [view, setView] = useState<PasskeyView>('list');
  const [passkeys, setPasskeys] = useState<WebAuthnPasskey[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<AllauthError[]>([]);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const [reauthEmail, setReauthEmail] = useState('');
  const [reauthHasPassword, setReauthHasPassword] = useState(false);
  const [reauthCode, setReauthCode] = useState('');
  const [reauthCodeSent, setReauthCodeSent] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');

  const supported = browserSupportsWebAuthn();

  function loadPasskeys() {
    return getPasskeys().then((resp) => {
      if (resp.status === 200 && Array.isArray(resp.data)) {
        const all = resp.data as unknown as Array<
          { type: string } & WebAuthnPasskey
        >;
        setPasskeys(all.filter((a) => a.type === 'webauthn'));
      } else {
        setPasskeys([]);
      }
      setLoading(false);
    });
  }

  useEffect(() => {
    loadPasskeys();
  }, []);

  function enterReauth(resp: AllauthResponse) {
    const data = resp.data as
      | { user?: { email?: string; has_usable_password?: boolean } }
      | undefined;
    setReauthEmail((data?.user?.email as string | undefined) ?? '');
    setReauthHasPassword(data?.user?.has_usable_password === true);
    setReauthCode('');
    setReauthCodeSent(false);
    setReauthPassword('');
    setErrors([]);
    setView('reauth');
  }

  async function addPasskey(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setBusy(true);
    try {
      const resp = await beginPasskeyRegistration();
      if (needsReauth(resp)) {
        enterReauth(resp);
        return;
      }
      if (resp.status !== 200 && resp.status !== 201) {
        setErrors(
          resp.errors ?? [{ message: 'Failed to start registration.' }],
        );
        return;
      }
      const options = (
        resp as unknown as {
          data: {
            creation_options: {
              publicKey: PublicKeyCredentialCreationOptionsJSON;
            };
          };
        }
      ).data.creation_options.publicKey;
      const credential = await startRegistration({ optionsJSON: options });
      const completeResp = await completePasskeyRegistration(
        credential,
        newName.trim() || 'My passkey',
      );
      if (completeResp.status === 200 || completeResp.status === 201) {
        setNewName('');
        setView('list');
        loadPasskeys();
      } else {
        setErrors(
          completeResp.errors ?? [{ message: 'Failed to register passkey.' }],
        );
      }
    } catch {
      setErrors([{ message: 'Passkey registration was cancelled.' }]);
    } finally {
      setBusy(false);
    }
  }

  async function removePasskey(id: number) {
    setErrors([]);
    setBusy(true);
    try {
      const resp = await deletePasskey(id);
      if (resp.status === 200 || resp.status === 204) {
        loadPasskeys();
      } else {
        setErrors(resp.errors ?? [{ message: 'Failed to remove passkey.' }]);
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
        setView('adding');
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
        setView('adding');
      } else {
        setErrors(
          resp.errors ?? [{ message: 'Incorrect password. Please try again.' }],
        );
      }
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-sm text-char/60">
        Your browser doesn&apos;t support passkeys.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-char/50">Loading&hellip;</p>;
  }

  if (view === 'reauth') {
    const cancelReauth = () => {
      setView('list');
      setErrors([]);
    };
    return (
      <div className="space-y-4">
        <NonFieldErrors errors={errors} />
        <p className="text-sm text-char/70">
          For security, confirm your identity before registering a passkey.
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
              <button type="submit" disabled={busy} className={primaryBtnMd}>
                {busy ? 'Confirming…' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={cancelReauth}
                className={outlineBtnMd}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : !reauthCodeSent ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSendReauthCode}
              disabled={busy}
              className={primaryBtnMd}
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
          </div>
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
              <button type="submit" disabled={busy} className={primaryBtnMd}>
                {busy ? 'Confirming…' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={cancelReauth}
                className={outlineBtnMd}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  if (view === 'adding') {
    return (
      <form onSubmit={addPasskey} className="space-y-4">
        <NonFieldErrors errors={errors} />
        <div>
          <label htmlFor="passkey-name" className={labelClass}>
            Passkey name
          </label>
          <input
            id="passkey-name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Touch ID, Face ID"
            className={inputClass}
            autoFocus
          />
          <p className="mt-1 text-xs text-char/50">
            Give this passkey a name so you can identify it later.
          </p>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={busy} className={primaryBtnMd}>
            {busy ? 'Registering…' : 'Register passkey'}
          </button>
          <button
            type="button"
            onClick={() => {
              setView('list');
              setErrors([]);
              setNewName('');
            }}
            className={outlineBtnMd}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-char/60">
        Passkeys let you sign in using your device&apos;s biometrics or PIN
        &mdash; no email code needed. Once registered, your browser will offer
        your passkey automatically when you sign in.
      </p>
      <NonFieldErrors errors={errors} />
      {passkeys.length === 0 ? (
        <p className="text-sm text-char/60">No passkeys registered yet.</p>
      ) : (
        <ul className="divide-y divide-char/10">
          {passkeys.map((pk) => (
            <li key={pk.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-char">{pk.name}</p>
                <p className="text-xs text-char/50">
                  Added {new Date(pk.created_at * 1000).toLocaleDateString()}
                  {pk.last_used_at &&
                    ` · Last used ${new Date(pk.last_used_at * 1000).toLocaleDateString()}`}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => removePasskey(pk.id)}
                className={`${outlineBtnSm} text-ember hover:text-ember`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => {
          setErrors([]);
          setView('adding');
        }}
        className={primaryBtnMd}
      >
        Add a passkey
      </button>
    </div>
  );
}
