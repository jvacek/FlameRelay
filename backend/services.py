import logging

from anymail.exceptions import AnymailRequestsAPIError
from celery import Task, shared_task
from celery.utils.log import get_task_logger
from django.core import mail
from geopy.distance import geodesic as distance

from config.constants import (
    EMAIL_TASK_MAX_RETRIES,
    EMAIL_TASK_RETRY_BACKOFF_MAX_SECONDS,
    EMAIL_TASK_RETRY_BACKOFF_SECONDS,
)


class EmailTask(Task):
    autoretry_for = (AnymailRequestsAPIError,)
    retry_kwargs = {"max_retries": EMAIL_TASK_MAX_RETRIES}
    retry_backoff = EMAIL_TASK_RETRY_BACKOFF_SECONDS
    retry_backoff_max = EMAIL_TASK_RETRY_BACKOFF_MAX_SECONDS
    retry_jitter = True


logger = logging.getLogger(__name__)


def unit_distance_cache_key(identifier: str) -> str:
    return f"unit:distance:{identifier}"


def distance_traveled_in_km(unit) -> float:
    checkins = unit.checkin_set.order_by("date_created")
    # Point.x = longitude, Point.y = latitude; geopy expects (lat, lng) tuples
    pts = [(p.y, p.x) for p in checkins.values_list("location", flat=True)]
    total_distance = sum(distance(pts[i], pts[i + 1]).km for i in range(len(pts) - 1))
    return round(total_distance, 2)


def total_distance_traveled_in_km() -> float:
    """Sum of per-unit cached distances. Computes and caches any misses individually."""
    from django.core.cache import cache  # noqa: PLC0415

    from .models import Unit  # noqa: PLC0415

    identifiers = list(Unit.objects.values_list("identifier", flat=True))
    keys = {unit_distance_cache_key(i): i for i in identifiers}
    cached = cache.get_many(keys.keys())

    total = sum(cached.values())

    missing = {i for k, i in keys.items() if k not in cached}
    if missing:
        to_set = {}
        for unit in Unit.objects.filter(identifier__in=missing):
            dist = distance_traveled_in_km(unit)
            to_set[unit_distance_cache_key(unit.identifier)] = dist
            total += dist
        from config.constants import UNIT_DISTANCE_CACHE_TTL  # noqa: PLC0415

        cache.set_many(to_set, UNIT_DISTANCE_CACHE_TTL)

    return round(total, 2)


logger = get_task_logger(__name__)


@shared_task(serializer="json")
def delete_checkin_image_file_task(image_name: str) -> None:
    from django.core.files.storage import default_storage  # noqa: PLC0415

    try:
        default_storage.delete(image_name)
    except Exception:
        logger.exception("Failed to delete CheckInImage file: %s", image_name)


@shared_task
def cleanup_orphaned_checkin_images():
    """Delete files in checkins/ storage that have no matching CheckInImage row."""
    from django.core.files.storage import default_storage  # noqa: PLC0415

    from .models import CheckInImage  # noqa: PLC0415

    referenced = set(CheckInImage.objects.values_list("image", flat=True))
    try:
        _, files = default_storage.listdir("checkins/")
    except FileNotFoundError, OSError:
        return 0
    deleted = 0
    for filename in files:
        path = f"checkins/{filename}"
        if path not in referenced:
            default_storage.delete(path)
            deleted += 1
    logger.info("Deleted %d orphaned checkin images", deleted)
    return deleted


@shared_task(base=EmailTask, serializer="json")
def send_email_to_subscribers_task(checkin_id: int):
    from django.contrib.sites.models import Site  # noqa: PLC0415
    from django.template.loader import render_to_string  # noqa: PLC0415
    from django.utils.html import strip_tags  # noqa: PLC0415

    from .models import CheckIn  # noqa: PLC0415

    try:
        checkin = CheckIn.objects.select_related("unit").get(pk=checkin_id)
    except CheckIn.DoesNotExist:
        logger.info("CheckIn %d no longer exists, skipping subscriber emails", checkin_id)
        return

    site = Site.objects.get_current()
    subject = f"LitRoute: New Check In for unit {checkin.unit.identifier}"
    from_email = f"LitRoute <noreply@{site.domain}>"

    messages = []
    subscribers = checkin.unit.subscribers.all()
    if checkin.created_by_id:
        subscribers = subscribers.exclude(pk=checkin.created_by_id)
    for user in subscribers:
        html_message = render_to_string(
            "backend/email_new_checkin.html", {"instance": checkin, "user": user, "site": site}
        )
        messages.append(
            {
                "subject": subject,
                "message": strip_tags(html_message),
                "from_email": from_email,
                "recipient_list": [user.email],
                "html_message": html_message,
            }
        )

    logger.info("Sending %d emails to subscribers for checkin %d", len(messages), checkin_id)
    for message in messages:
        mail.send_mail(**message, fail_silently=False)


def render_thank_you_email(checkin, site) -> str:
    from django.template.loader import render_to_string  # noqa: PLC0415

    return render_to_string("backend/email_thank_you_checkin.html", {"instance": checkin, "site": site})


@shared_task(base=EmailTask, serializer="json")
def send_thank_you_email_task(checkin_id: int):
    from django.contrib.sites.models import Site  # noqa: PLC0415
    from django.utils.html import strip_tags  # noqa: PLC0415

    from .models import CheckIn  # noqa: PLC0415

    try:
        checkin = CheckIn.objects.select_related("unit", "created_by").get(pk=checkin_id)
    except CheckIn.DoesNotExist:
        logger.info("CheckIn %d no longer exists, skipping thank-you email", checkin_id)
        return

    if checkin.created_by_id is None:
        return

    if not checkin.created_by.email:
        logger.info("CheckIn %d creator has no email, skipping thank-you email", checkin_id)
        return

    site = Site.objects.get_current()
    html_message = render_thank_you_email(checkin, site)
    logger.info("Sending thank-you email to %s for checkin %d", checkin.created_by.email, checkin_id)
    mail.send_mail(
        subject=f"Thanks for checking in {checkin.unit.identifier}",
        message=strip_tags(html_message),
        from_email=f"LitRoute <noreply@{site.domain}>",
        recipient_list=[checkin.created_by.email],
        html_message=html_message,
        fail_silently=False,
    )


@shared_task(base=EmailTask, serializer="json")
def send_guest_verification_email_task(token: str, email: str, unit_identifier: str, base_url: str):
    from django.contrib.sites.models import Site  # noqa: PLC0415
    from django.template.loader import render_to_string  # noqa: PLC0415
    from django.utils.html import strip_tags  # noqa: PLC0415

    site = Site.objects.get_current()
    verification_url = f"{base_url}/api/guest-verify/?token={token}"
    html_message = render_to_string(
        "backend/email_guest_verify.html",
        {"unit_identifier": unit_identifier, "verification_url": verification_url, "site": site},
    )
    logger.info("Sending guest verification email to %s for unit %s", email, unit_identifier)
    mail.send_mail(
        subject="Confirm your email for LitRoute updates",
        message=strip_tags(html_message),
        from_email=f"LitRoute <noreply@{site.domain}>",
        recipient_list=[email],
        html_message=html_message,
        fail_silently=False,
    )
