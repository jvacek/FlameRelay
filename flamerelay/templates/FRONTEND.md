# Frontend Architecture

Django owns every URL and renders a thin HTML shell. React mounts into `<div id="*-root">` elements. No React Router — navigation is plain `<a>` tags and `window.location.href`.

## Template → component map

| URL                              | Django view                         | Template                                               | React component                                                                                                                            |
| -------------------------------- | ----------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`                              | `TemplateView`                      | `pages/home.html`                                      | `pages/Home.tsx`                                                                                                                           |
| `/about/`                        | `TemplateView`                      | `pages/about.html`                                     | `pages/About.tsx`                                                                                                                          |
| `/accounts/login/`               | `login_view` (TemplateView)         | `account/login.html`                                   | `pages/Login.tsx` — unified sign-in **and** sign-up                                                                                        |
| `/accounts/signup/`              | `signup_view` (TemplateView)        | `account/signup.html`                                  | `pages/Signup.tsx` — name confirmation for authenticated users only                                                                        |
| `/accounts/confirm-email/<key>/` | `email_confirm_view` (TemplateView) | `account/email_confirm.html`                           | `pages/EmailConfirm.tsx` — used for secondary email verification links                                                                     |
| `/unit/<id>/`                    | `unit_view`                         | `backend/unit.html`                                    | `pages/Unit.tsx`                                                                                                                           |
| `/unit/<id>/checkin`             | `checkin_create_view`               | `backend/checkin_edit.html` (mode=create)              | `pages/CheckinCreate.tsx`                                                                                                                  |
| `/unit/<id>/checkin/<pk>`        | `checkin_edit_view`                 | `backend/checkin_edit.html` (mode=edit)                | `pages/CheckinEdit.tsx`                                                                                                                    |
| `/profile/`                      | `user_profile_view`                 | `users/user_detail.html`                               | `pages/UserDetail.tsx` — own profile only                                                                                                  |
| `/profile/update/`               | `user_update_view`                  | `users/user_form.html`                                 | `pages/UserForm.tsx`                                                                                                                       |
| `/profile/settings/`             | `user_settings_view`                | `users/user_settings.html`                             | `pages/UserSettings/` — profile, email, MFA, connected accounts (`index.tsx` + `ProfileSection.tsx`, `EmailSection.tsx`, `MfaSection.tsx`) |
| `403` / `404` / `500`            | Django error handlers               | `403.html` / `403_csrf.html` / `404.html` / `500.html` | `pages/ErrorPage.tsx`                                                                                                                      |

The Navbar component mounts on every page via `base.html`.

All three account views (`login_view`, `signup_view`, `email_confirm_view`) are plain `TemplateView` instances defined in `flamerelay/users/views.py` and registered explicitly in `config/urls.py`. `HEADLESS_ONLY = True` in settings removes allauth's own Bootstrap URL patterns; only the OAuth provider callback URLs survive from `allauth.urls`.

## Error pages

All HTTP error templates (`403.html`, `403_csrf.html`, `404.html`, `500.html`) are thin shells that mount `pages/ErrorPage.tsx` via `#error-root`. Pass the error code and optional context as `data-*` attributes:

```html
<div
  id="error-root"
  data-code="404"
  data-exception="{{ exception|default:'' }}"
></div>
```

The component derives the headline and description from `data-code`. The `403_csrf` case uses `data-csrf="true"` to switch to the session-expired copy. Use `text-amber` for 404 and `text-ember` for 403/500.

## Passing context from Django to React

Django passes data to components via `data-*` attributes on the root div. Read them with `element.dataset` in `project.tsx`:

```html
<!-- template -->
<div
  id="unit-root"
  data-identifier="{{ unit.identifier }}"
  data-checkin-url="{% url 'backend:checkin' unit.identifier %}"
  data-is-authenticated="{{ request.user.is_authenticated|lower }}"
  data-current-username="{{ request.user.username }}"
  data-login-url="{% url 'account_login' %}"
></div>
```

```tsx
// project.tsx
const d = unitRoot.dataset;
createRoot(unitRoot).render(
  <Unit
    identifier={d.identifier ?? ''}
    checkinUrl={d.checkinUrl ?? ''}
    isAuthenticated={d.isAuthenticated === 'true'}
    currentUsername={d.currentUsername ?? ''}
    loginUrl={d.loginUrl ?? '/accounts/login/'}
  />,
);
```

Boolean attributes must be lowercased in the template (`|lower` filter) and compared as strings in TSX (`=== 'true'`).

## CSRF

There are two CSRF-aware fetch wrappers — use the right one for the right API:

- **`/api/` endpoints** — use `apiFetch` from `api.ts`. Injects `X-CSRFToken` automatically.
- **`/_allauth/` endpoints** — use the functions in `lib/allauthApi.ts`. They handle their own CSRF internally using the same cookie.

```ts
import { apiFetch } from '../api';
await apiFetch(`/api/units/${identifier}/subscribe/`, { method: 'POST' });

import { logout } from '../lib/allauthApi';
await logout(); // calls DELETE /_allauth/browser/v1/auth/session
```

Never call `fetch()` directly for mutating requests to either API.

## Adding a new React page

1. Create `flamerelay/static/js/pages/MyPage.tsx` — export a default component
2. Update the Django view to render a thin template shell (no form logic in the view)
3. Create (or update) the template with a `<div id="my-page-root" data-...>` and required `data-*` attributes
4. Mount in `flamerelay/static/js/project.tsx`:
   ```tsx
   const myRoot = document.getElementById('my-page-root');
   if (myRoot) {
     createRoot(myRoot).render(
       <MyPage someProp={myRoot.dataset.someProp ?? ''} />,
     );
   }
   ```

## Checking pages with Chrome DevTools MCP

When the local stack is running (`just up`), use the Chrome DevTools MCP tools to visually verify UI changes. **Always use port 3000** — that is the webpack dev server with HMR, which serves the live-reloading frontend. Port 8000 (Django) also works for server-rendered content, but 3000 reflects in-progress frontend changes without a page reload.

Typical workflow:

```
mcp__chrome-devtools__navigate_page  →  http://localhost:3000/<path>
mcp__chrome-devtools__take_screenshot  →  verify layout / styles
mcp__chrome-devtools__get_console_message / list_console_messages  →  check for JS errors
```

### Pre-seeded test data

A unit with identifier **`test-123`** is seeded in the dev database with example check-ins, images, and travel history. Use it to test the unit page without creating data manually:

- Unit page: `http://localhost:3000/unit/test-123/`
- Check-in create: `http://localhost:3000/unit/test-123/checkin`

## Brand tokens

Declared in `flamerelay/static/css/project.css` under `@theme`. Use these class names — never raw hex values.

| Token        | Tailwind classes        | Value     |
| ------------ | ----------------------- | --------- |
| Amber Gold   | `text-amber` `bg-amber` | `#e8a030` |
| Char (dark)  | `text-char` `bg-char`   | `#1c1a15` |
| Ember Red    | `text-ember` `bg-ember` | `#c94c35` |
| Smoke Blue   | `text-smoke` `bg-smoke` | `#7b8fa1` |
| Parchment    | `bg-parchment`          | `#faf6ee` |
| Warm Linen   | `bg-linen`              | `#f0ead8` |
| Heading font | `font-heading`          | Fraunces  |
| Body font    | `font-body`             | DM Sans   |

Tailwind scans `../js/**/*.{ts,tsx}` and `../../templates/**/*.html` via `@source` directives — no safelisting needed.

## Auth flow (Login.tsx)

Auth is **passwordless**. `Login.tsx` is the single entry point for all users — new and returning.

Steps: `email → code → (name?) → app`

1. **`email`** (default): user enters email and clicks "Continue with email". Calls `POST /api/auth/code/request/` via `apiFetch` (our own endpoint). Always returns the same response regardless of whether the account exists — prevents enumeration. On success → `code`.
2. **`code`**: user enters the OTP from their email. Calls `POST /_allauth/browser/v1/auth/code/confirm`. On success → checks `/api/users/me/` for empty `name`.
3. **`name`** (new users only): if `me.name` is blank, shown inline before redirect. PATCHes `/api/users/{username}/` to save the name.
4. **`mfa`**: if the `mfa_authenticate` pending flow is present in the 401 response after code confirm.

On mount, `Login.tsx` also handles:

- `?code=<value>` in the URL — auto-submits the magic link code from the login email.
- `is_authenticated` session — redirects directly to the app (e.g. after OAuth callback lands back at `/accounts/login/`).
- `login_by_code` pending flow — restores the code-entry step if the user navigated away mid-flow.

Social providers appear on the `email` step via `<SocialProviders callbackUrl="/accounts/login/" />`. After OAuth, the provider redirects to `/accounts/google/login/callback/` (handled server-side by allauth), which then redirects back to `/accounts/login/`. The `useEffect` session check handles routing from there.

## Signup.tsx (name confirmation only)

`Signup.tsx` handles one case: an authenticated user who needs to set or update their display name. On mount it calls `getSession()`:

- If authenticated → fetches `/api/users/me/`, pre-fills the name field, shows the form.
- If not authenticated → `window.location.href = loginUrl` immediately.

Submit PATCHes `/api/users/{username}/` and redirects to `redirectUrl`.

New social users reach here when `me.name` is blank after OAuth — `checkNameThenRedirect()` in Login.tsx detects the blank name and redirects to `/accounts/signup/`. Email-code new users go through the inline `name` step in Login.tsx instead.

## Allauth headless API

API wrappers live in `flamerelay/static/js/lib/allauthApi.ts` and call `/_allauth/browser/v1/`. Use `X-CSRFToken` (same cookie pattern as `apiFetch`). Logout is handled inline in `Navbar.tsx` via `DELETE /auth/session` — no dedicated page.

**Exception**: `requestLoginCode()` in `allauthApi.ts` calls `POST /api/auth/code/request/` via `apiFetch`, not the allauth base URL. This is intentional — it's our own endpoint that handles account creation + allauth code initiation in one step.

MFA management (TOTP setup/teardown, recovery codes) is handled inline in `UserSettings.tsx` via the authenticators headless API (`/account/authenticators/…`). No separate MFA pages exist — `HEADLESS_ONLY = True` removed all Bootstrap views.
