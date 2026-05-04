# LitRoute

Track a lighter as it travels between people, places, and stories.

[![Python](https://img.shields.io/badge/Python-3.14-3776AB?logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-6.0-092E20?logo=django&logoColor=white)](https://djangoproject.com)
[![uv](https://img.shields.io/badge/uv-package%20manager-DE5FE9?logo=uv&logoColor=white)](https://github.com/astral-sh/uv)
[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Weblate](https://img.shields.io/badge/Weblate-translations-45ADA8?logo=weblate&logoColor=white)](https://hosted.weblate.org/projects/litroute/)

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![Celery](https://img.shields.io/badge/Celery-37814A?logo=celery&logoColor=white)](https://docs.celeryq.dev)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://docker.com)

![LitRoute homepage screenshot](docs/images/landing.png)
![LitRoute travel log screenshot](docs/images/example_log.png)

## Local development

All local dev runs through Docker via [`just`](justfile):

```bash
just build   # build images
just up      # start all services
just down    # stop services
```

See the `justfile` for the full command list (`just manage`, `just logs`, etc.).

## Translations

LitRoute is currently available in **English** and **French**. Translations are community-managed through [Weblate](https://hosted.weblate.org/projects/litroute/) — no coding needed.

To contribute a translation or improve an existing one, head to the Weblate project. Weblate integrates directly with this repo: accepted translations are submitted as pull requests automatically.

If you'd like to add a new language entirely, open an issue first so the locale can be wired up on the backend.

For terminology, tone, and brand guidance see [`brand/TRANSLATOR_GUIDE.md`](brand/TRANSLATOR_GUIDE.md).

## License

MIT
