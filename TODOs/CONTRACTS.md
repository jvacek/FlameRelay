# API Contract Testing (Backend ↔ Frontend Drift Detection)

## Why this exists

The project uses drf-spectacular to generate an OpenAPI 3.0 schema at `/api/schema/`, but
that schema is never committed or consumed by the frontend. Frontend interfaces are hand-rolled
and already out of sync — `UnitData` in `Unit.tsx` is missing `admin_only_checkin`, `team`,
`is_location_gps_enforced`, `game`, and `date_created` that `UnitSerializer` actually returns.
There are no e2e tests, so drift goes undetected until something visibly breaks in the UI.

The plan below creates two enforcement layers:

1. A Django test fails if the backend schema changes without regenerating the committed `openapi.yaml`
2. TypeScript errors (caught by the existing `tsc --noEmit` pre-commit hook) when the frontend
   types diverge from the committed spec

No new test runners or behavioral test frameworks are added.

---

## Implementation steps

### Step 1 — Generate and commit `openapi.yaml`

Run inside Docker (the volume mounts `.:/app`, so this writes to the repo root):

    just manage spectacular --file /app/openapi.yaml --validate

Commit `openapi.yaml` to the repo root. This becomes the contract artifact.

Add `just schema-update` to `justfile`:

```
# schema-update: Regenerate openapi.yaml from the current backend.
schema-update:
    @docker compose run --rm django python ./manage.py spectacular --file /app/openapi.yaml --validate
```

---

### Step 2 — Backend schema drift test

Create `backend/tests/test_schema_drift.py`:

```python
from pathlib import Path
import pytest
import yaml
from drf_spectacular.generators import SchemaGenerator

COMMITTED_SPEC = Path(__file__).resolve().parents[2] / "openapi.yaml"

@pytest.mark.django_db
def test_schema_matches_committed_file():
    """
    If this fails: run `just schema-update`, review the diff, commit openapi.yaml.
    """
    generator = SchemaGenerator()
    schema = generator.get_schema(request=None, public=True)
    committed = yaml.safe_load(COMMITTED_SPEC.read_text())
    assert schema == committed, (
        "openapi.yaml is out of date. Regenerate with: just schema-update"
    )
```

Key design choices:

- Uses `SchemaGenerator` directly in-process (no subprocess)
- Compares dicts not raw text, so YAML formatting differences don't cause false positives
- `public=True` matches what `SpectacularAPIView` uses

Run with: `just test backend/tests/test_schema_drift.py`

---

### Step 3 — TypeScript type generation

Install the package:

    npm install --save-dev openapi-typescript

Add to `package.json` scripts:

```json
"generate-api-types": "openapi-ts openapi.yaml -o flamerelay/static/js/api-types.gen.ts"
```

Run `npm run generate-api-types` and **commit** `flamerelay/static/js/api-types.gen.ts`.
The file is committed (not gitignored) so `tsc --noEmit` works on CI without regeneration.

Add `just api-types` to `justfile`:

```
# api-types: Regenerate TypeScript types from openapi.yaml.
api-types:
    npm run generate-api-types
```

---

### Step 4 — Wire generated types into frontend

Replace hand-rolled interfaces at API boundaries with generated types.
Internal UI state types (animation state, modal state, etc.) stay as-is.

**Import pattern:**

```typescript
import type { components } from '../api-types.gen';
type CheckIn = components['schemas']['CheckIn'];
type Unit = components['schemas']['Unit'];
```

**Files to update:**

`flamerelay/static/js/pages/Unit.tsx` (lines 21–40):

- Replace `CheckInData` interface with `type CheckInData = components['schemas']['CheckIn']`
- Replace `UnitData` interface with `type UnitData = components['schemas']['Unit']`

`flamerelay/static/js/pages/Home.tsx`:

- Replace `Stats` and `GlobePin` interfaces with generated equivalents

`flamerelay/static/js/pages/CheckinCreate.tsx`:

- Replace the inline `as { is_location_gps_enforced: boolean; game: { max_gps_drift: number } | null }`
  cast with `as components['schemas']['Unit']`

`flamerelay/static/js/api.ts` (line 34):

- Replace `as { token: string }` in `requestLocationClaim` with the generated response type
  (check what drf-spectacular names the LocationClaim response schema)

`flamerelay/static/js/AuthContext.tsx` (lines 10–15):

- Replace `AuthUser` interface with the generated `UserDetail` schema
  (fields: `username`, `name`, `is_superuser`, `admin_url`)

**Do NOT touch** `allauthApi.ts` types — those come from `/_allauth/browser/v1/` which is
outside drf-spectacular's scope and stays hand-rolled.

---

## Developer workflow after any serializer/view change

```
just schema-update   # regenerate openapi.yaml (backend drift test will pass again)
just api-types       # regenerate api-types.gen.ts
npx tsc --noEmit     # fix any TypeScript errors before committing
# then commit: openapi.yaml, api-types.gen.ts, and any fixed frontend files
```

---

## What this catches vs. misses

| Change                                      | Caught by                                                 |
| ------------------------------------------- | --------------------------------------------------------- |
| Backend renames a field                     | `test_schema_drift` in CI; then `tsc` after updating spec |
| Backend adds a required field               | Same                                                      |
| Frontend uses a field that no longer exists | `tsc --noEmit` pre-commit hook                            |
| Backend removes an endpoint                 | Schema drift test + types change                          |
| Wrong type for a field (string vs number)   | `tsc` after type replacement                              |
| Frontend ignores a 403/404 response         | **Not caught** — needs MSW behavioral tests (deferred)    |

---

## Critical files

| File                                           | Status                   | Role                                                      |
| ---------------------------------------------- | ------------------------ | --------------------------------------------------------- |
| `openapi.yaml`                                 | New, committed           | The contract artifact                                     |
| `backend/tests/test_schema_drift.py`           | New                      | Backend-side guard                                        |
| `flamerelay/static/js/api-types.gen.ts`        | New, generated+committed | Frontend contract                                         |
| `flamerelay/static/js/pages/Unit.tsx`          | Modify                   | Replace CheckInData, UnitData                             |
| `flamerelay/static/js/pages/Home.tsx`          | Modify                   | Replace Stats, GlobePin                                   |
| `flamerelay/static/js/pages/CheckinCreate.tsx` | Modify                   | Replace inline cast                                       |
| `flamerelay/static/js/api.ts`                  | Modify                   | Type requestLocationClaim return                          |
| `flamerelay/static/js/AuthContext.tsx`         | Modify                   | Replace AuthUser                                          |
| `justfile`                                     | Modify                   | Add schema-update and api-types targets                   |
| `package.json`                                 | Modify                   | Add openapi-typescript devDep + generate-api-types script |

---

## Verification

1. `just test backend/tests/test_schema_drift.py` — should pass
2. Rename any serializer field, re-run — should fail
3. `just schema-update` — test passes again
4. `just api-types` — `api-types.gen.ts` changes
5. `npx tsc --noEmit` — errors wherever the old field name was used in frontend
