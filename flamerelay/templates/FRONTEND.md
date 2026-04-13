# Frontend Architecture

Django owns every URL and renders a thin HTML shell. React mounts into `<div id="*-root">` elements. No React Router — navigation is plain `<a>` tags and `window.location.href`.

## Template → component map

| URL | Django view | Template | React component |
| --- | --- | --- | --- |
| `/` | `homepage_view` | `pages/home.html` | `pages/Home.tsx` |
| `/about/` | `about_view` | `pages/about.html` | `pages/About.tsx` |
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

All mutating API calls go through `flamerelay/static/js/api.ts`, which reads the `csrftoken` cookie and injects the `X-CSRFToken` header automatically for `POST`, `PATCH`, `PUT`, and `DELETE` requests.

```ts
import { apiFetch } from '../api';

await apiFetch(`/api/units/${identifier}/subscribe/`, { method: 'POST' });
```

Never use `fetch()` directly for mutating requests.

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

## Allauth exception

Login, signup, and account-management pages (`/accounts/…`) are **not** React-migrated. They use allauth's Bootstrap templates with Bootstrap 5.3 loaded via CDN. The `allauth/layouts/entrance.html` overrides `{% block body %}` entirely, so the React navbar does not appear on those pages — this is intentional and should not change.
