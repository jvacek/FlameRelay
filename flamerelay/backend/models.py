import os
from uuid import uuid4

from django.core.validators import RegexValidator
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.urls import reverse
from django.utils import timezone
from django_resized import ResizedImageField
from location_field.models.plain import PlainLocationField

from flamerelay.users.models import User

from .services import send_email_to_subscribers_task

# Create your models here.
# from django.utils.translation import ugettext_lazy as _


class Unit(models.Model):
    identifier = models.CharField(
        max_length=200,
        unique=True,
        validators=[
            RegexValidator(
                regex=r"^\w{3,}",
                message="Identifier must start with at least three characters",
            ),
            RegexValidator(
                regex=r"\d{2,}$",
                message="Identifier must end with two digits",
            ),
            RegexValidator(
                regex=r"^\w*-\d*$",
                message="Characters and digits must be separated by a dash",
            ),
        ],
    )
    date_created = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    subscribers = models.ManyToManyField(User, related_name="subscribed_units", blank=True)

    class Meta:
        verbose_name = "Unit"
        verbose_name_plural = "Units"

    def __str__(self):
        return self.identifier

    def get_map(self):
        from .services import create_map

        return create_map(self)

    def get_distance_travelled(self):
        from .services import distance_travelled_in_km

        return distance_travelled_in_km(self)


def path_and_rename(instance, filename):
    # This omne is in the migrations so keep that in mind pls
    upload_to = "checkins/"
    ext = filename.split(".")[-1]
    filename = f"{uuid4().hex}.{ext}"
    return os.path.join(upload_to, filename)


class CheckIn(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT)
    date_created = models.DateTimeField(editable=False, default=timezone.now)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    image = ResizedImageField(
        # upload_to="checkins/",
        upload_to=path_and_rename,
        blank=True,
        null=True,
        size=[1024, 1024],
    )
    message = models.TextField(blank=True)
    city = models.CharField(max_length=255, blank=True, null=True)
    location = PlainLocationField(based_fields=["city"], zoom=7, blank=True, null=True)

    class Meta:
        ordering = ["date_created"]

    def __str__(self):
        return f"{str(self.unit)} {str(self.date_created)}"


@receiver(post_save, sender=CheckIn)
def send_email_to_subscribers(sender, instance, created, **kwargs):
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

    send_email_to_subscribers_task.delay(messages)
