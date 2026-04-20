from django.conf import settings


def allauth_settings(request):
    """Expose some settings from django-allauth in templates."""
    return {
        "ACCOUNT_ALLOW_REGISTRATION": settings.ACCOUNT_ALLOW_REGISTRATION,
    }


def build_info(request):
    return {
        "GIT_HASH": settings.GIT_HASH,
        "GITHUB_REPO_URL": settings.GITHUB_REPO_URL,
    }


def maptiler_key(request):
    return {"maptiler_key": settings.MAPTILER_KEY}
