import logging

from celery import shared_task
from celery.utils.log import get_task_logger
from django.conf import settings
from django.core import mail
from geopy.distance import geodesic as distance
from geopy.geocoders import GoogleV3, Nominatim

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


@shared_task(serializer="json")
def send_email_to_subscribers_task(messages):
    logger.info("Sending %d emails to subscribers", len(messages))
    for message in messages:
        logger.info("Sending email to %s", message["recipient_list"])
        mail.send_mail(**message, fail_silently=False)


if hasattr(settings, "GOOGLE_MAPS_API_KEY"):
    geolocator = GoogleV3(api_key=settings.GOOGLE_MAPS_API_KEY)
else:
    logger.warning("GOOGLE_MAPS_API_KEY not set, using Nominatim")
    geolocator = Nominatim(user_agent="litroute.com")


def get_country(location):
    if location := geolocator.reverse(location, exactly_one=True):
        address = location.raw["address_components"]
        for component in address:
            if "country" in component["types"]:
                return component["long_name"]
    return None
