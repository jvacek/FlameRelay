# CLAUDE.md

> **For Claude:** Keep this file up to date. After any change that affects project structure, API endpoints, architectural decisions, or established conventions, update the relevant section before finishing. If a new pattern is introduced that future work should follow, document it here.
>
> **Constants:** All magic numbers and tunable values (timeouts, TTLs, limits, thresholds) belong in `config/constants.py`. Never inline them — add the constant first, then use it. This applies proactively: if you encounter an inline magic number while working on nearby code, move it to constants as part of the same change.

## Project Overview

flamerelay (brand name: **LitRoute**) is a Django app for tracking "lighters" (Units) as they travel between locations. Users check in a unit with a location, image, and message; subscribers get email notifications; a map shows the travel history.

## Tech Stack

### Backend

- **Python 3.14 / Django 6.0** via `uv`
- **PostgreSQL** — primary database (`ATOMIC_REQUESTS = True`)
- **Redis** — Celery broker, result backend, and production cache
- **Celery + Celery Beat** — async tasks and periodic scheduling (DB scheduler)
- **Django REST Framework + drf-spectacular** — REST API with OpenAPI 3.0 docs
- **django-allauth** — auth with MFA; username-only login, mandatory email verification
- **Google Cloud Storage** — production media/static file storage
- **Sentry** — production error tracking
- **SendGrid (anymail)** — production email

### Frontend

- **React 19 + TypeScript** — component-driven UI
- **Tailwind CSS v4** — utility-first styling via `@tailwindcss/postcss` PostCSS plugin (no config file; tokens in `@theme` block)
- **Webpack 5 + Node 24** — asset pipeline with `webpack-bundle-tracker` for Django integration
- **Babel** — `@babel/preset-react` (runtime: automatic) + `@babel/preset-typescript`
- **ESLint + tsc** — enforced via pre-commit hooks

**Bootstrap is gone** from the main bundle. Allauth pages (login/signup/manage) still load Bootstrap 5.3 via CDN because they use allauth's Bootstrap templates and are not being React-migrated.

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
| Django  | http://localhost:8000 | Main app                  |
| Webpack | http://localhost:3000 | Frontend dev server (HMR) |
| Mailpit | http://localhost:8025 | Local email UI            |
| Flower  | http://localhost:5555 | Celery monitoring         |

### Environment files

Secrets live in `.envs/.local/` (git-ignored). Do not commit these.

## Running Tests

Tests run inside Docker via pytest:

```bash
just manage test                          # Django test runner (not preferred)
docker compose run --rm django pytest     # preferred: pytest directly
```

Or if running locally with `uv`:

```bash
uv run pytest
uv run coverage run -m pytest && uv run coverage html
```

Config in `pyproject.toml` (`[tool.pytest.ini_options]`): uses `config.settings.test`, `--reuse-db` enabled.

## Linting & Formatting

**Ruff** handles both linting and formatting (120-char line length). Pre-commit hooks run automatically on commit:

```bash
uv run ruff check .           # lint
uv run ruff format .          # format
pre-commit run --all-files    # run all hooks manually
```

Pre-commit also runs: Prettier (JS/CSS), djLint (templates), django-upgrade, pyproject-fmt, ESLint (TS/TSX), and `tsc --noEmit`.

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
  templates/        # thin Django shells; see templates/FRONTEND.md for the full map
backend/            # Unit, CheckIn, Team models + views + DRF API
brand/              # Brand identity reference (colours, fonts, writing style)
```

## REST API

All endpoints are under `/api/`. For the full, up-to-date endpoint reference see the live Swagger UI at **`/api/docs/`** (requires admin login in production; open in local dev).

The router is in `config/api_router.py`; Unit/CheckIn routes are added as manual `path()` entries (not router-registered) because they use a nested URL structure. The browsable API root (`/api/`) only lists router-registered routes — `/api/docs/` is the authoritative reference.

### API conventions

- Edit/delete grace periods are defined in `config/constants.py` (`CHECKIN_EDIT_GRACE_PERIOD_HOURS`, `CHECKIN_DELETE_GRACE_PERIOD_HOURS`).
- `SerializerMethodField` methods are annotated with Python return types so drf-spectacular generates correct schemas.
- No-body endpoints (e.g. subscribe/unsubscribe) use `@extend_schema(request=None, responses={204: None, 401: None})`.

## Key Architectural Choices

- **Custom User model**: single `name` field instead of first/last — do not add first/last name fields.
- **`ATOMIC_REQUESTS = True`**: every request is wrapped in a DB transaction.
- **AllAuth controls admin login**: admin is routed through allauth's workflow.
- **OpenAPI docs are admin-only** in production (`/api/schema/`, `/api/docs/`).
- **Celery Beat uses DB scheduler** (`django-celery-beat`) — manage periodic tasks via Django admin.
- **CORS** is restricted to `/api/*` paths only.
- **Argon2** password hashing in production; MD5 only in tests for speed.

### Frontend Architecture

See `flamerelay/templates/FRONTEND.md` for the template→component map, data-\* attribute conventions, CSRF usage, brand tokens, and how to add a new page.

Critical conventions to keep in mind:

- **CSRF**: always use `apiFetch` from `api.ts` for mutating requests — never raw `fetch()`.
- **Tailwind tokens**: use named tokens (`text-amber`, `bg-char`, `font-heading`, etc.) — never raw hex values.
- **Allauth exception**: login/signup pages are not React-migrated and must stay that way.
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
