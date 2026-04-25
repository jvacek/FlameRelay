from __future__ import annotations

import logging
import uuid

from allauth.account.models import EmailAddress
from allauth.mfa.models import Authenticator
from allauth.socialaccount.models import SocialAccount
from celery import shared_task
from django.core import mail
from django.core.files.storage import default_storage
from django.db import transaction

from backend.models import CheckIn

logger = logging.getLogger(__name__)

_REMOVED_ITEMS = [
    "Your email address and sign-in methods",
    "Your name and profile information",
    "All photos you uploaded to check-ins",
    "All messages you left on check-ins",
    "Your unit subscriptions",
]


@shared_task(serializer="json")
def send_account_deletion_email_task(email: str) -> None:
    from django.contrib.sites.models import Site  # noqa: PLC0415
    from django.template.loader import render_to_string  # noqa: PLC0415
    from django.utils.html import strip_tags  # noqa: PLC0415

    site = Site.objects.get_current()
    html_message = render_to_string(
        "backend/email_account_deleted.html",
        {"email": email, "removed_items": _REMOVED_ITEMS, "site": site},
    )
    logger.info("Sending account deletion confirmation to %s", email)
    mail.send_mail(
        subject="Your LitRoute account has been deleted",
        message=strip_tags(html_message),
        from_email=f"LitRoute <noreply@{site.domain}>",
        recipient_list=[email],
        html_message=html_message,
        fail_silently=False,
    )


def anonymize_user(user) -> None:
    email = user.email

    image_names = list(
        CheckIn.objects.filter(created_by=user)
        .exclude(image="")
        .exclude(image__isnull=True)
        .values_list("image", flat=True)
    )

    with transaction.atomic():
        anon_id = uuid.uuid4().hex
        user.email = f"deleted_{anon_id}@deleted.invalid"
        user.username = f"deleted_{anon_id}"
        user.name = ""
        user.is_active = False
        user.set_unusable_password()
        user.save()

        EmailAddress.objects.filter(user=user).delete()
        SocialAccount.objects.filter(user=user).delete()
        Authenticator.objects.filter(user=user).delete()

        CheckIn.objects.filter(created_by=user).update(image="", message="")
        user.subscribed_units.clear()

        transaction.on_commit(lambda: send_account_deletion_email_task.delay(email))

    # File deletion is intentionally outside the transaction: storage ops are
    # non-transactional. Any failures here leave the file unreferenced in the DB
    # (image="" above), so cleanup_orphaned_checkin_images will GC them on next run.
    for image_name in image_names:
        try:
            default_storage.delete(image_name)
        except Exception:
            logger.exception("Failed to delete anonymized checkin image: %s", image_name)
