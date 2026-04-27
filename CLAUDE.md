# CLAUDE.md

> **For Claude:** Keep this file up to date. After any change that affects project structure, API endpoints, architectural decisions, or established conventions, update the relevant section before finishing. If a new pattern is introduced that future work should follow, document it here.
>
> **After completing any task**, ask: "Would this have been faster if the docs said X?" If yes, add X — to this file or to the relevant spec file (e.g. `FRONTEND.md`). The bar is: would a future Claude session have needed to explore or ask about this? If so, document it now.
>
> **Constants:** All magic numbers and tunable values (timeouts, TTLs, limits, thresholds) belong in `config/constants.py`. Never inline them — add the constant first, then use it. This applies proactively: if you encounter an inline magic number while working on nearby code, move it to constants as part of the same change.
> When making large plans, consider if this is realistically possible to do in one context window. If not, put the plan into an .md file in the repo's root with enough context for a subsequent agent being able to pick up when you run out of context tokens.

## Project Overview

flamerelay (brand name: **LitRoute**) is a Django app for tracking "lighters" (Units) as they travel between locations. Users check in a unit with a location, image, and message; subscribers get email notifications; a map shows the travel history.

## Tech Stack

### Backend

- **Python 3.14 / Django 6.0** via `uv` — **PEP 758**: `except E1, E2:` (no parentheses) is valid syntax in 3.14; do not "fix" it to `except (E1, E2):`
- **PostgreSQL** — primary database (`ATOMIC_REQUESTS = True`)
- **Redis** — Celery broker, result backend, and production cache
- **Celery + Celery Beat** — async tasks and periodic scheduling (DB scheduler)
- **Django REST Framework + drf-spectacular** — REST API with OpenAPI 3.0 docs
- **django-allauth** — auth with MFA and headless API; **passwordless only** — magic code (OTP) + social OAuth; no passwords, no email verification step
- **Google Cloud Storage** — production media/static file storage
- **Sentry** — production error tracking
- **SendGrid (anymail)** — production email

### Frontend

- **React 19 + TypeScript** — component-driven UI
- **Tailwind CSS v4** — utility-first styling via `@tailwindcss/postcss` PostCSS plugin (no config file; tokens in `@theme` block)
- **Webpack 5 + Node 24** — asset pipeline with `webpack-bundle-tracker` for Django integration
- **Babel** — `@babel/preset-react` (runtime: automatic) + `@babel/preset-typescript`
- **ESLint + tsc** — enforced via pre-commit hooks

**Bootstrap is gone** from the main bundle. All auth and account-management pages are React components using the allauth headless API. `HEADLESS_ONLY = True` strips all allauth Bootstrap views; MFA management is inline in `UserSettings.tsx` via `/_allauth/browser/v1/account/authenticators/`.

## Local Development

All local dev runs through Docker. Use `just` commands (see `justfile`):

```
just build          # build Docker images
just up             # start all containers (detached)
just down           # stop containers
just logs           # tail logs for all services
just logs django    # tail logs for a specific service
just manage <cmd>   # run manage.py commands, e.g. `just manage migrate`
just prune          # remove containers AND volumes (destructive)
```

### Local services and ports

| Service | URL                   | Purpose                   |
| ------- | --------------------- | ------------------------- |
| Django  | http://localhost:8000 | Backend                   |
| Webpack | http://localhost:3000 | Frontend dev server (HMR) |
| Mailpit | http://localhost:8025 | Local email UI            |
| Flower  | http://localhost:5555 | Celery monitoring         |

### Environment files

Secrets live in `.envs/.local/` (git-ignored). Do not commit these.

## Running Tests

Tests **must** run inside Docker — `DATABASE_URL` and other env vars are only present there. `uv run pytest` will fail locally unless you've manually configured the full env.

```bash
just test                  # run the full suite
just test -k test_name     # run a specific test
```

Config in `pyproject.toml` (`[tool.pytest.ini_options]`): uses `config.settings.test`, `--reuse-db` enabled.

### Testing conventions

- **Every API endpoint must have at least one test in `backend/tests/test_api_endpoints.py`**. Cover: happy path, auth requirement, and key error cases.
- Unit/crypto logic lives in `backend/tests/test_location_token.py` (or a similar per-module file) — keep it separate from endpoint tests.

## Linting & Formatting

**Ruff** handles both linting and formatting (120-char line length). Pre-commit hooks run automatically on commit:

```bash
uv run ruff check .           # lint
uv run ruff format .          # format
pre-commit run --all-files    # run all hooks manually
```

Pre-commit also runs: Prettier (JS/CSS), djLint (templates), django-upgrade, pyproject-fmt, ESLint (TS/TSX), and `tsc --noEmit`.

**After writing or editing any `.py` file, always run Ruff before finishing:**

```bash
uv run ruff check --fix <file>
uv run ruff format <file>
```

**After writing or editing any `.ts`, `.tsx`, or `.css` file, always run Prettier and ESLint before finishing:**

```bash
npx prettier --write <file>
npx eslint <file>
npx tsc --noEmit
```

Settings are in `.prettierrc` (`singleQuote: true`, `tabWidth: 2`). Templates are excluded. Running Prettier manually avoids pre-commit failures caused by formatting differences.

**In JSX text, never use bare apostrophes or quotes.** The `react/no-unescaped-entities` ESLint rule rejects them. Use HTML entities instead:

- `'` → `&apos;` (e.g. `we&apos;ll`, `don&apos;t`)
- `"` → `&quot;`

Prettier does not fix this — it must be done manually when writing JSX.

## Project Structure

```
config/
  settings/         # base / local / production / test
  urls.py           # root URL config
  api_router.py     # DRF router + manual nested URL patterns for units/checkins
  constants.py      # shared business-logic constants (grace periods, etc.)
flamerelay/
  users/            # custom User model (AbstractUser, single "name" field) + API
  static/           # Tailwind entry point (project.css) + React entry (project.tsx)
  templates/        # spa.html (single shell) + email templates; see templates/FRONTEND.md
backend/            # Unit, CheckIn, Team models + views + DRF API
brand/              # Brand identity reference (colours, fonts, writing style)
```

## REST API

All endpoints are under `/api/`. For the full, up-to-date endpoint reference see the live Swagger UI at **`/api/docs/`** (requires admin login in production; open in local dev).

The router is in `config/api_router.py`. All routes are registered as manual `path()` entries — the DRF router has no registered viewsets. The browsable API root (`/api/`) is therefore empty; `/api/docs/` is the authoritative reference.

### Notable endpoints

- `POST /api/auth/code/request/` — unified sign-in / sign-up. Creates the account if it doesn't exist, then triggers allauth's magic-code flow. Always returns `{"detail": "Code sent."}` regardless of whether the email was registered (anti-enumeration). Rate-limited via allauth's built-in `ratelimit.consume()`. Implemented in `flamerelay/users/api/views.py::RequestCodeView`.
- `GET /api/account/` — returns `{ username, name, is_superuser, … }` for the authenticated user. Used by `AuthContext` on every page load to populate auth state. Also supports `PATCH` (update name), `PUT`, and `DELETE` (account anonymisation). Implemented in `flamerelay/users/api/views.py::AccountView`.
- `GET /api/account/subscriptions/` — returns the list of units the authenticated user is subscribed to.
- `DELETE /api/account/social-accounts/` — disconnect a connected social OAuth account.
- `GET /api/config/` — public endpoint returning `{ maptilerKey, allowRegistration }`. Fetched once per session by `useConfig()` and cached in a module-level promise.

### API conventions

- Edit/delete grace periods are defined in `config/constants.py` (`CHECKIN_EDIT_GRACE_PERIOD_HOURS`, `CHECKIN_DELETE_GRACE_PERIOD_HOURS`).
- `SerializerMethodField` methods are annotated with Python return types so drf-spectacular generates correct schemas.
- No-body endpoints (e.g. subscribe/unsubscribe) use `@extend_schema(request=None, responses={204: None, 401: None})`.
- CheckIn responses include `created_by_name` (from `User.name`) alongside `created_by_username`.

## Key Architectural Choices

- **Custom User model**: single `name` field instead of first/last — do not add first/last name fields. `name` is the public display name everywhere (checkins, profile page, avatar initials).
- **No public user profiles**: `/profile/` shows the authenticated user's own profile only — there are no per-user public profile URLs. `UserDetailView` and `users:detail` do not exist; `User.get_absolute_url()` returns `"/profile/"`. Do not add a `<username>/` lookup route.
- **Passwordless auth**: `ACCOUNT_EMAIL_VERIFICATION = "none"`, `ACCOUNT_SIGNUP_FIELDS = ["email*"]`. No passwords. Magic code proves email ownership; social OAuth proves identity. Users always land on `/accounts/login/` which serves as the unified sign-in + sign-up page.
- **`/accounts/signup/`** renders only for authenticated users confirming/updating their display name. Unauthenticated visitors are redirected to login. New social users are sent here by `checkNameThenRedirect()` in Login.tsx when `me.name` is blank after OAuth.
- **`ATOMIC_REQUESTS = True`**: every request is wrapped in a DB transaction.
- **AllAuth controls admin login**: admin is routed through allauth's workflow.
- **OpenAPI docs are admin-only** in production (`/api/schema/`, `/api/docs/`).
- **Celery Beat uses DB scheduler** (`django-celery-beat`) — manage periodic tasks via Django admin.
- **CORS** is restricted to `/api/*` paths only.

### Frontend Architecture

The frontend is a **true SPA**: Django serves a single `spa.html` shell for every non-API URL; React Router owns all client-side routing. There are no per-page Django views or templates (only `spa.html` and email templates remain).

**Read `flamerelay/templates/FRONTEND.md` before touching any template or React file.** It is the authoritative reference for the route→component map, auth conventions, CSRF wrappers, brand tokens, and how to add or modify pages.

Critical conventions to keep in mind:

- **Routing**: all routes are declared in `flamerelay/static/js/App.tsx`. Protected routes are wrapped in `<PrivateRoute>` — do not add auth guards inside page components.
- **Auth state**: use `useAuth()` from `AuthContext.tsx` to get `{ isAuthenticated, username, name, isSuperuser, loading, refresh }`. Never read auth state from the URL or Django template context.
- **Config**: use `useConfig()` from `lib/useConfig.ts` to get `{ maptilerKey, allowRegistration }`. Never hardcode the MapTiler key.
- **CSRF**: use `apiFetch` from `api.ts` for `/api/` requests. For allauth headless endpoints (`/_allauth/`), use `allauthApi.ts` which handles its own CSRF — do not use raw `fetch()` for either.
- **401 handling**: after a failed mutation returns 401, call `await refresh()` then `navigate('/accounts/login/')` — do not treat 401 as a form validation error.
- **404 handling on initial data loads**: always check `r.ok` (or `r.status`) before calling `.json()` on a GET that loads page data. DRF error bodies (`{"detail": "Not found."}`) are valid JSON — without the check they silently become the component's state. Pattern: `if (!r.ok) { setNotFound(true); return null; }` then render `<ErrorPage code={404} />` when `notFound` is true. See `Unit.tsx` and `CheckinEdit.tsx` for reference.
- **`UnitViewSet` is public read**: it uses `IsAuthenticatedOrReadOnly` so unauthenticated GET requests are allowed. All user-specific fields (`is_subscribed`, `can_check_in`) return safe defaults for anonymous users.
- **Tailwind tokens**: use named tokens (`text-amber`, `bg-char`, `font-heading`, etc.) — never raw hex values.
- **Mobile-first**: most users arrive via QR scan on a phone. Write base styles for mobile, layer `sm:`/`lg:` on top for wider screens. Verify every UI change looks correct at 375 px before calling it done. Full checklist in `FRONTEND.md` → "Mobile-first design".
- **Allauth headless**: the magic-code request goes to `POST /api/auth/code/request/` via `apiFetch` (our own endpoint). Code confirmation and MFA use `/_allauth/browser/v1/` via `allauthApi.ts`. MFA management is inline in `UserSettings.tsx` — no separate Bootstrap MFA pages exist (`HEADLESS_ONLY = True` removed them all).
- **`StatsView` permission**: explicitly set to `AllowAny` — it inherits `IsAuthenticatedOrReadOnly` from the global default otherwise.

## Dependency Management

Uses `uv`. To add/update packages:

```bash
uv add <package>           # add runtime dependency
uv add --dev <package>     # add dev dependency
uv sync                    # sync environment from lockfile
```

After changing dependencies, rebuild the Docker image: `just build`.

### Frontend (npm)

```bash
# Run inside the node container or locally with Node 24
npm install <package>       # add dependency (updates package-lock.json)
npm install                 # sync from package-lock.json
```

After adding npm packages, the node container needs its volume refreshed. If running in Docker:

```bash
docker compose rm -f -v node   # remove container + anonymous node_modules volume
just up                         # recreate with fresh install
```
