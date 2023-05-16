import logging

import folium
from celery import shared_task
from celery.utils.log import get_task_logger
from django.core.mail import send_mass_mail
from geopy.distance import geodesic as distance

logger = logging.getLogger(__name__)


def create_map(unit) -> folium.Map:
    checkins = unit.checkin_set.order_by("date_created")
    if checkins.count() == 0:
        return folium.Map()
    location_strings: list[str] = checkins.values_list("location", flat=True)
    points = [tuple(map(float, j.split(","))) for j in location_strings]

    m = folium.Map()
    # add markers
    for i, checkin in enumerate(checkins):
        point = tuple(checkin.location.split(","))
        color = "blue"
        popup = ""
        if i == 0:
            color = "green"
            popup = "Start\n"
        elif i == len(points) - 1:
            color = "red"
            popup = "Finish\n"
        popup += f"{checkin.date_created}\n{checkin.city}"
        folium.Marker(point, popup=popup, icon=folium.Icon(color=color)).add_to(m)

    # add the lines
    if checkins.count() > 1:
        folium.PolyLine(points, weight=5, opacity=1).add_to(m)

        def getlat(p):
            return p[0]

        def getlon(p):
            return p[1] * -1

        sw = min(points, key=lambda p: (getlat(p), (getlon(p))))
        ne = max(points, key=lambda p: (getlat(p), (getlon(p))))

        m.fit_bounds([sw, ne])
    return m


def distance_travelled_in_km(unit) -> float:
    checkins = unit.checkin_set.order_by("date_created")
    location_strings: list[str] = checkins.values_list("location", flat=True)
    points = [tuple(map(float, j.split(","))) for j in location_strings]
    total_distance = sum(distance(points[i], points[i + 1]).km for i in range(len(points) - 1))
    return round(total_distance, 2)


logger = get_task_logger(__name__)


@shared_task(serializer="json")
def send_email_to_subscribers_task(messages):
    logger.info(f"Sending {len(messages)} emails to subscribers")
    send_mass_mail(messages, fail_silently=False)
