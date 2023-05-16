import logging

import folium
from celery import shared_task
from django.core.mail import send_mass_mail
from django.urls import reverse
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


@shared_task
def send_email_to_subscribers_task(sender, instance, created, **kwargs):
    if not created:
        return
    subject = f"FlameRelay: New Check In for unit {instance.unit.identifier}"
    body = "A lighter you subscribed to has seen a new place!\n"
    body = f"Checkin created at {instance.date_created}.\n"
    body += f"Message: {instance.message}\n"
    body += f"Location: {instance.location}\n"
    body += f"City: {instance.city}\n"
    if instance.image:
        body += f"<img src='{instance.image.url}'\n"
    body += f"View Unit page: {reverse('backend:unit', kwargs={'identifier':instance.unit.identifier})}\n"
    body += (
        "You can unsubscribe from this lighter's journey by clicking <a href='"
        + reverse("backend:unit", kwargs={"identifier": instance.unit.identifier})
        + "?action=unsubscribe'>this link</a>"
    )

    messages = []
    for user in instance.unit.subscribers.all():
        profile_text = (
            " or manage all your subscriptions on your <a href='"
            + reverse("users:detail", kwargs={"pk": user.id})
            + ">profile page</a>\n"
        )

        messages += [
            (
                subject,
                body + profile_text,
                "noreply@flamerelay.org",
                [user.email],
            )
        ]

    if getattr(instance, "_DO_NOT_SEND_EMAILS", False):
        logger.info("Not sending emails because of _DO_NOT_SEND_EMAILS")
    else:
        send_mass_mail(messages, fail_silently=False)
