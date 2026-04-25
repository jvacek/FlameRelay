# Frontend Architecture

Django serves a **single HTML shell** (`flamerelay/templates/spa.html`) for every non-API URL. React Router owns all client-side routing. There are no per-page Django views or templates — `spa.html` and the transactional email templates are the only `.html` files.

`/api/`, `/_allauth/`, and `/admin/` are handled entirely server-side and are unaffected by client-side routing.

## Route → component map

All routes are declared in `flamerelay/static/js/App.tsx`. The `<Layout>` wrapper (Navbar + footer) wraps every route. Routes marked **PrivateRoute** redirect unauthenticated users to `/accounts/login/?next=<path>`.

| URL                                    | React component                                                 | Auth         |
| -------------------------------------- | --------------------------------------------------------------- | ------------ |
| `/`                                    | `pages/Home.tsx`                                                | —            |
| `/about/`                              | `pages/About.tsx`                                               | —            |
| `/accounts/login/`                     | `pages/Login.tsx` — unified sign-in **and** sign-up             | —            |
| `/accounts/signup/`                    | `pages/Signup.tsx` — name confirmation for authenticated users  | —            |
| `/accounts/confirm-email/:key`         | `pages/EmailConfirm.tsx`                                        | —            |
| `/unit/:identifier/`                   | `pages/Unit.tsx`                                                | —            |
| `/unit/:identifier/checkin`            | `pages/CheckinCreate.tsx`                                       | PrivateRoute |
| `/unit/:identifier/checkin/:checkinId` | `pages/CheckinEdit.tsx`                                         | PrivateRoute |
| `/profile/`                            | `pages/UserDetail.tsx` — own profile only                       | PrivateRoute |
| `/profile/update/`                     | `pages/UserForm.tsx`                                            | PrivateRoute |
| `/profile/settings/`                   | `pages/UserSettings/` — profile, email, MFA, connected accounts | PrivateRoute |
| `/socialconnect/`                      | `pages/SocialConnections.tsx`                                   | PrivateRoute |
| `*`                                    | `pages/ErrorPage.tsx` (code=404)                                | —            |

## Auth state (AuthContext)

`flamerelay/static/js/AuthContext.tsx` wraps the app in `<AuthProvider>`. On mount it calls `GET /api/users/me/` and stores the result. Use the `useAuth()` hook in any component:

```tsx
const { isAuthenticated, username, name, isSuperuser, loading, refresh } =
  useAuth();
```

- `loading` is `true` until the initial `/api/users/me/` call resolves — gate any auth-dependent render behind it.
- Call `await refresh()` after any action that changes auth state (login, logout, name save).
- After a mutation returns 401 (session expired), call `await refresh()` then `navigate('/accounts/login/')`.

`PrivateRoute` (`flamerelay/static/js/PrivateRoute.tsx`) renders a loading state while `loading` is true, then redirects to `/accounts/login/?next=<full-path>` if not authenticated. Do not add auth guards inside page components — add a `<PrivateRoute>` wrapper in `App.tsx` instead.

## Global config (useConfig)

`flamerelay/static/js/lib/useConfig.ts` fetches `GET /api/config/` once and caches the result in a module-level promise. Use it anywhere you need the MapTiler key or registration flag:

```tsx
const config = useConfig();
const maptilerKey = config?.maptilerKey ?? '';
```

`config` is `null` on first render until the fetch resolves. If the fetch fails, `configPromise` is reset to `null` so the next component mount retries; the failed call returns `{ maptilerKey: '', allowRegistration: false }`.

Never hardcode the MapTiler key — always read it from `useConfig()`.

## Error pages

- **404** — the catch-all `<Route path="*">` in `App.tsx` renders `<ErrorPage code={404} />`.
- **500 (uncaught render error)** — `ErrorBoundary` in `App.tsx` catches unhandled React errors and renders `<ErrorPage code={500} />`.
- **Django server errors** (e.g. 500 before React loads) — Django's own error handler; these are rare since the SPA shell has no server-side logic.

`ErrorPage` derives headline and description from the `code` prop. Pass `code={403}` for permission errors, `code={500}` for unexpected failures. Use `text-amber` for 404 and `text-ember` for 403/500 (the component handles this internally).

## CSRF

There are two CSRF-aware fetch wrappers — use the right one for the right API:

- **`/api/` endpoints** — use `apiFetch` from `api.ts`. Injects `X-CSRFToken` automatically on mutating methods.
- **`/_allauth/` endpoints** — use the functions in `lib/allauthApi.ts`. They handle their own CSRF internally.

```ts
import { apiFetch } from '../api';
await apiFetch(`/api/units/${identifier}/subscribe/`, { method: 'POST' });

import { logout } from '../lib/allauthApi';
await logout(); // calls DELETE /_allauth/browser/v1/auth/session
```

Never call `fetch()` directly for either API — not for GETs on authenticated endpoints, not for mutations.

## Adding a new React page

1. Create `flamerelay/static/js/pages/MyPage.tsx` — export a default component. Use `useParams()` for URL segments, `useAuth()` for auth state, `useConfig()` for API keys.
2. Add a `<Route>` in `App.tsx`. Wrap in `<PrivateRoute>` if login is required.
3. No Django view needed — the catch-all `spa_view` in `config/urls.py` handles all non-API routes automatically.

```tsx
// App.tsx — add inside the <Route element={<Layout />}> block
<Route
  path="/my-page/:id/"
  element={
    <PrivateRoute>
      <MyPage />
    </PrivateRoute>
  }
/>
```

## Frontend tests

Unit tests live in `flamerelay/static/js/__tests__/`. Run them with:

```bash
npm test
```

The test suite uses **Jest + babel-jest** (reuses the existing Babel config) with `jest-environment-jsdom`. `@testing-library/react` is installed but not yet used.

**Scope is intentionally narrow** — only pure/logic-heavy functions, not component rendering:

- `api.test.ts` — `getCsrfToken` (cookie regex edge cases) and `apiFetch` (CSRF header injection per HTTP method)
- `allauthApi.test.ts` — `hasPendingFlow` (all conditional branches) and `redirectToProvider` (DOM form construction, CSRF field, and `callbackUrl` validation)

**Testing gaps** (worth adding — see `SPA.md` for rationale):

- `allauthApi.ts` — `redirectToProvider` throws on a non-`/`-prefixed `callbackUrl`
- `useConfig.ts` — failed fetch resets `configPromise` to `null` so the next mount retries

When adding new tests, keep to the same pattern: pure functions and clear input/output contracts. Component tests require mocking async state and fetch — add them only when the complexity clearly justifies it.

## Checking pages with Chrome DevTools MCP

When the local stack is running (`just up`), use the Chrome DevTools MCP tools to visually verify UI changes. **Always use port 3000** — that is the webpack dev server with HMR, which serves the live-reloading frontend. Port 8000 (Django) also works but won't reflect in-progress frontend changes without a page reload.

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

## Mobile-first design

**Most users arrive on a phone** — they scan a QR sticker on a lighter and land straight on the Unit page. Design for that context first.

### Default approach

- Write the **base (unprefixed) styles for mobile** and layer `sm:` / `lg:` on top for wider viewports. Never write desktop styles first and try to undo them on mobile.
- Target **375 px** as the smallest supported viewport (iPhone SE / older Android). Content should be readable and functional at that width with no horizontal scroll.
- Tap targets must be **at least 44 × 44 px** — buttons, links, and interactive icons. Use generous `py-` and `px-` padding rather than relying on the text alone.
- Avoid interactions that only work on hover (`hover:` utilities are fine as an enhancement but the element must be fully usable without them).
- Keep font sizes readable on mobile: body copy `text-base` (16 px) as a floor; `text-sm` only for supporting metadata (dates, labels). Never use `text-xs` for anything the user needs to read to understand a page.

### Key breakpoints

| Prefix | Min-width | Typical use |
| ------ | --------- | ----------- |
| *(none)* | 0 px | Mobile — the primary layout |
| `sm:` | 640 px | Two-column layouts, side images, wider cards |
| `lg:` | 1024 px | Full desktop layouts, wider max-widths |

### Checklist before calling a UI change done

- [ ] Does it look correct at 375 px width? (Chrome DevTools → device toolbar, or `sm` breakpoint in Tailwind)
- [ ] Are all tap targets large enough?
- [ ] Does any absolutely/fixed-positioned element overlap content on small screens?
- [ ] If the layout is `flex-row` on desktop, does `flex-col` (mobile stacking order) make sense?

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

## Component style system

The project uses an explicit design-token layer on top of Tailwind to avoid generic defaults and keep the visual language consistent. There are two places tokens are defined.

### Radius tokens (`project.css`)

Three `@theme` variables generate Tailwind utility classes:

| CSS variable      | Tailwind class    | Value | Used on                          |
| ----------------- | ----------------- | ----- | -------------------------------- |
| `--radius-btn`    | `rounded-btn`     | 4 px  | All interactive buttons          |
| `--radius-input`  | `rounded-input`   | 4 px  | Text inputs and textareas        |
| `--radius-card`   | `rounded-card`    | 6 px  | Content cards and auth containers|

Never use `rounded-lg` / `rounded-xl` / `rounded-2xl` for buttons, inputs, or cards — those are Tailwind defaults and look generic. Use the named tokens above. `rounded-full` is reserved for circular elements (avatars, pill badges).

### Button and input constants (`styles.ts`)

`flamerelay/static/js/styles.ts` exports fully-composed class strings. Always import from there instead of constructing button or input classes inline.

```ts
import {
  primaryBtnLg, primaryBtnMd, primaryBtn,  // amber fill — Lg/Md differ in padding; primaryBtn adds w-full
  emberBtnMd,                               // destructive red fill
  outlineBtnLg, outlineBtnMd, outlineBtnSm, // border/ghost
  inputClass,                               // full-width text input / textarea
  labelClass,                               // form label
  secondaryBtn,                             // compact inline action (email row buttons etc.)
} from '../styles';
```

Sizing guide:
- **Lg** (`px-[22px] py-[9px]`) — primary page actions (submit, hero CTA)
- **Md** (`px-[18px] py-[7px]`) — secondary page actions (settings saves, nav buttons)
- **Sm** (`px-3 py-[5px]`) — compact inline actions inside forms or tables

### Button conventions

All buttons share a lift-on-hover pattern (`hover:-translate-y-px active:translate-y-0`) rather than the default opacity fade (`hover:opacity-90`). The `disabled:pointer-events-none` class is included in every button base so the lift effect does not apply to disabled buttons.

- Use `tracking-wide` on button text (it is baked into the `btnBase` in `styles.ts`).
- Avoid `px-4 py-2`, `px-6 py-3`, or any other grid-aligned padding on buttons — the off-grid arbitrary values are intentional.
- The `primaryBtn` export (full-width) is for auth-page submit buttons only. Everywhere else use `primaryBtnLg` or `primaryBtnMd`.

## Maps

Map pages use **MapLibre GL JS** via **react-map-gl** (`react-map-gl/maplibre`). Tiles are served by MapTiler — the API key comes from `useConfig()`:

```tsx
const config = useConfig();
const maptilerKey = config?.maptilerKey ?? '';
```

Style URL pattern:

```
https://api.maptiler.com/maps/dataviz/style.json?key=${maptilerKey}
```

Pages with maps: `Unit.tsx` (travel history) and `CheckinForm.tsx` (location picker). Do not import from `react-leaflet` or `leaflet` — those packages have been removed.

## Auth flow (Login.tsx)

Auth is **passwordless**. `Login.tsx` is the single entry point for all users — new and returning.

Steps: `email → code → (name?) → app`

1. **`email`** (default): user enters email and clicks "Continue with email". Calls `POST /api/auth/code/request/` via `apiFetch` (our own endpoint). Always returns the same response regardless of whether the account exists — prevents enumeration. On success → `code`.
2. **`code`**: user enters the OTP from their email. Calls `POST /_allauth/browser/v1/auth/code/confirm`. On success → checks `/api/users/me/` for empty `name`.
3. **`name`** (new users only): if `me.name` is blank, shown inline before redirect. PATCHes `/api/users/{username}/` to save the name. Calls `refresh()` then navigates.
4. **`mfa`**: if the `mfa_authenticate` pending flow is present in the 401 response after code confirm.

On mount, `Login.tsx` also handles:

- `?code=<value>` in the URL — auto-submits the magic link code from the login email.
- `is_authenticated` session — redirects directly to the app (e.g. after OAuth callback lands back at `/accounts/login/`).
- `login_by_code` pending flow — restores the code-entry step if the user navigated away mid-flow.

Social providers appear on the `email` step via `<SocialProviders callbackUrl="/accounts/login/" />`. After OAuth, the provider redirects to `/accounts/google/login/callback/` (handled server-side by allauth), which then redirects back to `/accounts/login/`. The `useEffect` session check handles routing from there.

## Signup.tsx (name confirmation only)

`Signup.tsx` handles one case: an authenticated user who needs to set or update their display name. On mount it calls `getSession()`:

- If authenticated → fetches `/api/users/me/`, pre-fills the name field, shows the form.
- If not authenticated → `navigate('/accounts/login/')` immediately.

Submit PATCHes `/api/users/{username}/`, calls `refresh()`, then navigates to `redirectUrl`.

New social users reach here when `me.name` is blank after OAuth — `checkNameThenRedirect()` in Login.tsx detects the blank name and navigates to `/accounts/signup/`. Email-code new users go through the inline `name` step in Login.tsx instead.

## Allauth headless API

API wrappers live in `flamerelay/static/js/lib/allauthApi.ts` and call `/_allauth/browser/v1/`. Use `X-CSRFToken` (same cookie pattern as `apiFetch`). Logout is handled inline in `Navbar.tsx` via `DELETE /auth/session` — after `logout()` resolves, `refresh()` is called to clear the auth context before navigating.

**Exception**: `requestLoginCode()` in `allauthApi.ts` calls `POST /api/auth/code/request/` via the top-level-imported `getCsrfToken`, not a dynamic import. This is intentional — it's our own endpoint that handles account creation + allauth code initiation in one step.

MFA management (TOTP setup/teardown, recovery codes) is handled inline in `UserSettings.tsx` via the authenticators headless API (`/account/authenticators/…`). No separate MFA pages exist — `HEADLESS_ONLY = True` removed all Bootstrap views.
