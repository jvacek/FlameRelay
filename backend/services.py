import logging

from celery import shared_task
from celery.utils.log import get_task_logger
from django.core import mail
from geopy.distance import geodesic as distance

logger = logging.getLogger(__name__)


def unit_distance_cache_key(identifier: str) -> str:
    return f"unit:distance:{identifier}"


def distance_traveled_in_km(unit) -> float:
    # TODO switch to PostGIS and use the distance function
    checkins = unit.checkin_set.order_by("date_created")
    location_strings: list[str] = checkins.values_list("location", flat=True)
    points = [tuple(map(float, j.split(","))) for j in location_strings]
    total_distance = sum(distance(points[i], points[i + 1]).km for i in range(len(points) - 1))
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


@shared_task
def cleanup_orphaned_checkin_images():
    """Delete files in checkins/ storage that have no matching CheckIn row."""
    from django.core.files.storage import default_storage  # noqa: PLC0415

    from .models import CheckIn  # noqa: PLC0415

    referenced = set(CheckIn.objects.exclude(image="").exclude(image__isnull=True).values_list("image", flat=True))
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


@shared_task(serializer="json")
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
    for user in checkin.unit.subscribers.exclude(pk=checkin.created_by_id):
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
        logger.info("Sending email to %s", message["recipient_list"])
        mail.send_mail(**message, fail_silently=False)


def render_thank_you_email(checkin, site) -> str:
    from django.template.loader import render_to_string  # noqa: PLC0415

    return render_to_string("backend/email_thank_you_checkin.html", {"instance": checkin, "site": site})


@shared_task(serializer="json")
def send_thank_you_email_task(checkin_id: int):
    from django.contrib.sites.models import Site  # noqa: PLC0415
    from django.utils.html import strip_tags  # noqa: PLC0415

    from .models import CheckIn  # noqa: PLC0415

    try:
        checkin = CheckIn.objects.select_related("unit", "created_by").get(pk=checkin_id)
    except CheckIn.DoesNotExist:
        logger.info("CheckIn %d no longer exists, skipping thank-you email", checkin_id)
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
