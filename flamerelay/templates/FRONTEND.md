# Frontend Architecture

Django owns every URL and renders a thin HTML shell. React mounts into `<div id="*-root">` elements. No React Router — navigation is plain `<a>` tags and `window.location.href`.

## Template → component map

| URL | Django view | Template | React component |
| --- | --- | --- | --- |
| `/` | `homepage_view` | `pages/home.html` | `pages/Home.tsx` |
| `/about/` | `about_view` | `pages/about.html` | `pages/About.tsx` |
| `/accounts/login/` | allauth `account_login` | `account/login.html` | `pages/Login.tsx` |
| `/accounts/signup/` | allauth `account_signup` | `account/signup.html` | `pages/Signup.tsx` |
| `/accounts/confirm-email/<key>/` | allauth `account_confirm_email` | `account/email_confirm.html` | `pages/EmailConfirm.tsx` |
| `/accounts/password/reset/` | allauth `account_reset_password` | `account/password_reset.html` | `pages/PasswordReset.tsx` |
| `/accounts/password/reset/key/<uid>/<key>/` | allauth `account_reset_password_from_key` | `account/password_reset_from_key.html` | `pages/PasswordResetFromKey.tsx` |
| `/accounts/email/` | allauth `account_email` | `account/email.html` | `pages/EmailManage.tsx` |
| `/backend/unit/<id>/` | `unit_view` | `backend/unit.html` | `pages/Unit.tsx` |
| `/backend/unit/<id>/checkin` | `checkin_create_view` | `backend/checkin_edit.html` (mode=create) | `pages/CheckinCreate.tsx` |
| `/backend/unit/<id>/checkin/<pk>` | `checkin_edit_view` | `backend/checkin_edit.html` (mode=edit) | `pages/CheckinEdit.tsx` |
| `/users/<username>/` | `user_detail_view` | `users/user_detail.html` | `pages/UserDetail.tsx` |
| `/users/~update/` | `user_form_view` | `users/user_form.html` | `pages/UserForm.tsx` |

The Navbar component mounts on every page via `base.html`.

## Passing context from Django to React

Django passes data to components via `data-*` attributes on the root div. Read them with `element.dataset` in `project.tsx`:

```html
<!-- template -->
<div id="unit-root"
  data-identifier="{{ unit.identifier }}"
  data-checkin-url="{% url 'backend:checkin' unit.identifier %}"
  data-is-authenticated="{{ request.user.is_authenticated|lower }}"
  data-current-username="{{ request.user.username }}"
  data-login-url="{% url 'account_login' %}">
</div>
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
  />
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
     createRoot(myRoot).render(<MyPage someProp={myRoot.dataset.someProp ?? ''} />);
   }
   ```

## Brand tokens

Declared in `flamerelay/static/css/project.css` under `@theme`. Use these class names — never raw hex values.

| Token | Tailwind classes | Hex |
| --- | --- | --- |
| Amber Gold | `text-amber` `bg-amber` | `#e8a030` |
| Char (dark) | `text-char` `bg-char` | `#1c1a15` |
| Ember Red | `text-ember` `bg-ember` | `#c94c35` |
| Smoke Blue | `text-smoke` `bg-smoke` | `#7b8fa1` |
| Parchment | `bg-parchment` | `#faf6ee` |
| Warm Linen | `bg-linen` | `#f0ead8` |
| Heading font | `font-heading` | Fraunces |
| Body font | `font-body` | DM Sans |

Tailwind scans `../js/**/*.{ts,tsx}` and `../../templates/**/*.html` via `@source` directives — no safelisting needed.

## Allauth headless API

Login and signup are React pages that call the allauth headless API at `/_allauth/browser/v1/`. API wrappers live in `flamerelay/static/js/lib/allauthApi.ts`. Use `X-CSRFToken` (same cookie pattern as `apiFetch`). Logout is handled inline in `Navbar.tsx` via `DELETE /auth/session` — no dedicated page.

The following account-management pages remain as allauth Bootstrap pages (not React-migrated):

- `/accounts/2fa/…` — MFA management
