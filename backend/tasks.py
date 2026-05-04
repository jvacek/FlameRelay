import os

from celery import shared_task
from django.conf import settings
from django.db import connection


@shared_task
def health_check():
    connection.ensure_connection()
    if not os.access(settings.MEDIA_ROOT, os.W_OK):
        msg = f"Media directory {settings.MEDIA_ROOT} is not writable (uid={os.getuid()})"
        raise RuntimeError(msg)
