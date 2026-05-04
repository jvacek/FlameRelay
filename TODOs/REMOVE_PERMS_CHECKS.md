# Remove media directory writability checks

These checks were added as a workaround for bind-mount permission issues on the Hetzner VPS
(`/srv/flamerelay/media` owned by root, blocking the `django` user from writing images).
Once media is served from object storage (e.g. S3, GCS), the local filesystem is no longer
involved and these checks become dead code.

## What to remove

### `backend/apps.py`

The entire `ready()` method — it checks `os.access(settings.MEDIA_ROOT, os.W_OK)` on startup
and fires a Sentry alert if the directory isn't writable.

### `backend/tasks.py`

The media writability block in `health_check()`:

```python
if not os.access(settings.MEDIA_ROOT, os.W_OK):
    msg = f"Media directory {settings.MEDIA_ROOT} is not writable (uid={os.getuid()})"
    raise RuntimeError(msg)  # noqa: TRY003
```

Keep the DB connectivity check (`connection.ensure_connection()`).

## Trigger condition

Switch to object storage (`django-storages` with S3/GCS) so `MEDIA_ROOT` is no longer used
for writes. At that point the local bind-mount and its permission issues are gone entirely.
