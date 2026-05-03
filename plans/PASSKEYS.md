# Passkey (WebAuthn) Implementation Notes

This document covers what needs to change to add passkey support to the login flow.
allauth's WebAuthn support is marked experimental as of 65.x — review the changelog before
starting.

---

## How it should feel to the user

The email input on the login page shows browser-native passkey suggestions in the autofill
dropdown (no extra UI). If the user picks one, they authenticate immediately via biometrics
or PIN — no email code, no TOTP. If they don't have a passkey or ignore the suggestion, the
normal email code flow continues unchanged.

This works because discoverable credentials (resident keys) are stored locally in the
browser/OS. The browser knows which passkeys belong to this site without asking the server
first, so there's no email enumeration risk.

---

## Backend

### 1. Install the WebAuthn extras

```bash
uv add "django-allauth[mfa,webauthn]"
# also needs py-webauthn (pulled in transitively, but pin it explicitly)
```

Rebuild the Docker image after: `just build`

### 2. Settings (`config/settings/base.py`)

```python
MFA_SUPPORTED_TYPES = ["totp", "recovery_codes", "webauthn"]
MFA_PASSKEY_LOGIN_ENABLED = True   # enables /_allauth/browser/v1/auth/webauthn/login
MFA_PASSKEY_SIGNUP_ENABLED = False  # passkey-only signup; leave False for now

MFA_WEBAUTHN_ALLOW_INSECURE_ORIGIN = True  # local dev only — set in local.py, not base.py
```

`MFA_PASSKEY_LOGIN_ENABLED` is what activates the `LoginWebAuthnView` headless endpoint.

### 3. Migration

allauth stores WebAuthn credentials in the `allauth_mfa_authenticator` table (same as TOTP).
No new migrations needed — the existing table supports it.

### 4. Adapter (optional but recommended)

Override `get_public_key_credential_rp_entity` in `MFAAdapter` if the RP ID or name needs
customising (defaults to the current domain, which is usually correct):

```python
# flamerelay/users/adapters.py
from allauth.mfa.adapter import DefaultMFAAdapter

class MFAAdapter(DefaultMFAAdapter):
    def get_public_key_credential_rp_entity(self) -> dict:
        return {"id": "flamerelay.com", "name": "LitRoute"}
```

```python
# config/settings/base.py
MFA_ADAPTER = "flamerelay.users.adapters.MFAAdapter"
```

---

## Headless API endpoints (added automatically when enabled)

| Method     | URL                                                    | Purpose                                                                             |
| ---------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `GET`      | `/_allauth/browser/v1/auth/webauthn/login`             | Returns `publicKey` challenge options (no user required — discoverable credentials) |
| `POST`     | `/_allauth/browser/v1/auth/webauthn/login`             | Submits the credential assertion; logs the user in                                  |
| `GET`      | `/_allauth/browser/v1/auth/2fa/webauthn/authenticate`  | Challenge for WebAuthn as a _second_ factor (after email code)                      |
| `POST`     | `/_allauth/browser/v1/auth/2fa/webauthn/authenticate`  | Submits assertion for the second-factor flow                                        |
| `GET/POST` | `/_allauth/browser/v1/account/authenticators/webauthn` | Manage registered passkeys (requires auth)                                          |

The `GET /auth/webauthn/login` response shape is a standard WebAuthn
`PublicKeyCredentialRequestOptions` JSON object, ready to pass directly to
`navigator.credentials.get()`. allauth sets `residentKey: "required"` and
`userVerification: "preferred"` for the login flow.

---

## Frontend

### 1. Add helper functions to `allauthApi.ts`

```ts
export async function getPasskeyLoginOptions(): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const resp = await allauthFetch('GET', '/auth/webauthn/login');
  return (resp as any).data;
}

export async function passkeyLogin(
  credential: AuthenticationResponseJSON,
): Promise<AllauthResponse> {
  return allauthFetch(
    'POST',
    '/auth/webauthn/login',
    credential as unknown as Record<string, unknown>,
  );
}
```

These use the standard JSON encoding from the WebAuthn spec. The browser returns
`AuthenticationResponseJSON`; allauth accepts it directly.

Consider using the `@github/webauthn-json` or `@simplewebauthn/browser` npm package to
handle the `navigator.credentials.get()` call cleanly — it converts between the raw
`ArrayBuffer`-heavy WebAuthn API and the JSON-serialisable form allauth expects.

```bash
npm install @simplewebauthn/browser
```

### 2. Update `Login.tsx`

On mount (alongside the existing `getSession()` check), start a **conditional** WebAuthn
request. Add `autocomplete="username webauthn"` to the email input so the browser knows to
surface passkey suggestions in the autofill UI.

`handleAuthResponse` is currently a `useCallback` — include it in the dependency array of
the new effect, and store the abort controller in a `useRef` so `sendCode` can call
`abortController.current?.abort()` before starting the email flow.

```tsx
import { startAuthentication } from '@simplewebauthn/browser';
import { getPasskeyLoginOptions, passkeyLogin } from '../lib/allauthApi';

// Add inside the Login component alongside the existing useEffect:
const passkeyAbort = useRef<AbortController | null>(null);

useEffect(() => {
  async function startConditionalPasskey() {
    if (
      !PublicKeyCredential.isConditionalMediationAvailable ||
      !(await PublicKeyCredential.isConditionalMediationAvailable())
    ) {
      return;
    }
    try {
      const options = await getPasskeyLoginOptions();
      passkeyAbort.current = new AbortController();
      const credential = await startAuthentication({
        optionsJSON: options,
        useBrowserAutofill: true,
        signal: passkeyAbort.current.signal,
      });
      handleAuthResponse(await passkeyLogin(credential));
    } catch {
      // user dismissed, timed out, or no passkey — fall through to email flow
    }
  }

  void startConditionalPasskey();
  return () => passkeyAbort.current?.abort();
}, [handleAuthResponse]);
```

In `sendCode`, abort before proceeding:

```tsx
async function sendCode(e: React.FormEvent) {
  e.preventDefault();
  passkeyAbort.current?.abort(); // cancel conditional passkey request
  // ... rest of sendCode unchanged
}
```

Add `autoComplete="username webauthn"` to the email `<input>`:

```tsx
<input
  id="email"
  type="email"
  autoComplete="username webauthn"  // was "email"
  ...
/>
```

The `useBrowserAutofill: true` flag means `credentials.get()` never shows a modal — it only
surfaces passkeys through the autofill UI. If the user ignores it, the promise never
resolves and the normal flow continues.

### 3. MFA step — WebAuthn as second factor

The existing TOTP form handles `type="text"` codes. If a user has WebAuthn registered as
their only MFA method, the current form is useless for them. This case needs separate
handling:

1. On entering the `mfa` step, `GET /_allauth/browser/v1/auth/2fa/webauthn/authenticate`
   to check if WebAuthn is available (the response will include challenge options).
2. If WebAuthn options are returned, call `startAuthentication()` automatically (not
   conditional — show a modal).
3. Post the assertion to `POST /_allauth/browser/v1/auth/2fa/webauthn/authenticate`.

A user could have both TOTP and WebAuthn registered, so the MFA step should offer both.

---

## Registering passkeys (settings page)

Users need a way to register passkeys after they're logged in. `UserSettings` is now split
into a folder (`pages/UserSettings/`). Add a new `PasskeySection.tsx` alongside the
existing `MfaSection.tsx`, `EmailSection.tsx`, and `ProfileSection.tsx`, then mount it in
`index.tsx` as a new `<Section title="Passkeys">` block.

The flow:

1. `GET /_allauth/browser/v1/account/authenticators/webauthn` — list existing passkeys
2. `POST` to begin registration, then `PUT` with the attestation — allauth's
   `ManageWebAuthnView` handles both
3. Display registered passkeys with a delete option

---

## Known limitations / things to verify

- **`ALLOWED_ORIGINS`**: allauth uses `py-webauthn` which validates the request origin
  against the RP ID. In local dev behind the Docker reverse proxy, ensure
  `MFA_WEBAUTHN_ALLOW_INSECURE_ORIGIN = True` is set in `config/settings/local.py`.
- **HTTPS required in production**: WebAuthn is blocked on non-HTTPS origins. Ensure
  `SECURE_SSL_REDIRECT = True` and the RP ID matches the production domain.
- **Safari quirks**: Safari requires a user gesture to trigger `credentials.get()` even
  for conditional mediation. The `startAuthentication` call should be inside a user
  interaction handler if Safari compatibility is critical.
- **allauth WebAuthn is still experimental** — review the allauth changelog before
  starting and check for breaking changes in the `Authenticator` model or headless API.
