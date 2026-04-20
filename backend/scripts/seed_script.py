import random

import factory
from django.db.models.signals import post_save
from geopy.distance import geodesic

from backend.factories import CheckInFactory, UnitFactory
from backend.models import Unit
from flamerelay.users.models import User

CITIES = [
    (48.8566, 2.3522, "Paris, France"),
    (51.5074, -0.1278, "London, UK"),
    (52.5200, 13.4050, "Berlin, Germany"),
    (41.9028, 12.4964, "Rome, Italy"),
    (40.4168, -3.7038, "Madrid, Spain"),
    (55.7558, 37.6173, "Moscow, Russia"),
    (59.9343, 30.3351, "Saint Petersburg, Russia"),
    (50.0755, 14.4378, "Prague, Czech Republic"),
    (47.4979, 19.0402, "Budapest, Hungary"),
    (52.2297, 21.0122, "Warsaw, Poland"),
    (48.2082, 16.3738, "Vienna, Austria"),
    (45.4642, 9.1900, "Milan, Italy"),
    (43.7102, 7.2620, "Nice, France"),
    (53.3498, -6.2603, "Dublin, Ireland"),
    (55.6761, 12.5683, "Copenhagen, Denmark"),
    (59.9139, 10.7522, "Oslo, Norway"),
    (59.3293, 18.0686, "Stockholm, Sweden"),
    (60.1695, 24.9354, "Helsinki, Finland"),
    (40.7128, -74.0060, "New York, USA"),
    (34.0522, -118.2437, "Los Angeles, USA"),
    (41.8781, -87.6298, "Chicago, USA"),
    (29.7604, -95.3698, "Houston, USA"),
    (33.4484, -112.0740, "Phoenix, USA"),
    (47.6062, -122.3321, "Seattle, USA"),
    (45.5051, -122.6750, "Portland, USA"),
    (37.7749, -122.4194, "San Francisco, USA"),
    (49.2827, -123.1207, "Vancouver, Canada"),
    (43.6532, -79.3832, "Toronto, Canada"),
    (45.5017, -73.5673, "Montreal, Canada"),
    (19.4326, -99.1332, "Mexico City, Mexico"),
    (-23.5505, -46.6333, "São Paulo, Brazil"),
    (-34.6037, -58.3816, "Buenos Aires, Argentina"),
    (35.6762, 139.6503, "Tokyo, Japan"),
    (37.5665, 126.9780, "Seoul, South Korea"),
    (31.2304, 121.4737, "Shanghai, China"),
    (39.9042, 116.4074, "Beijing, China"),
    (1.3521, 103.8198, "Singapore"),
    (13.7563, 100.5018, "Bangkok, Thailand"),
    (28.6139, 77.2090, "New Delhi, India"),
    (19.0760, 72.8777, "Mumbai, India"),
    (-33.8688, 151.2093, "Sydney, Australia"),
    (-37.8136, 144.9631, "Melbourne, Australia"),
    (30.0444, 31.2357, "Cairo, Egypt"),
    (-26.2041, 28.0473, "Johannesburg, South Africa"),
    (6.5244, 3.3792, "Lagos, Nigeria"),
]

MAX_TRAVEL_RADIUS_KM = 4000


def _nearby_cities(lat, lng):
    current = (lat, lng)
    return [c for c in CITIES if geodesic(current, (c[0], c[1])).km <= MAX_TRAVEL_RADIUS_KM]


# Create a bunch of units with checkins
@factory.django.mute_signals(post_save)
def run():
    if not User.objects.exists():
        user = User.objects.create_user(email="test@abc.com", password="test")  # noqa: S106
    elif User.objects.filter(is_superuser=True).exists():
        user = User.objects.filter(is_superuser=True).first()
    else:
        user = User.objects.first()
    print(user)  # noqa: T201

    if Unit.objects.filter(identifier="test-123").exists():
        unit = Unit.objects.get(identifier="test-123")
        unit.checkin_set.all().delete()
        unit.delete()

    unit = UnitFactory(identifier="test-123", created_by=user)

    n = 10
    for i in range(n):
        current_city = random.choice(CITIES)  # noqa: S311
        for _ in range(7):
            lat, lng, place_name = current_city
            CheckInFactory(unit=unit, created_by=user, location=f"{lat},{lng}", place=place_name)
            candidates = _nearby_cities(lat, lng) or CITIES
            current_city = random.choice(candidates)  # noqa: S311
        if i != n - 1:
            unit = UnitFactory(created_by=user)
