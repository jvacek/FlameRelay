import os
from uuid import uuid4

from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags
from django_case_insensitive_field import CaseInsensitiveFieldMixin
from django_resized import ResizedImageField
from location_field.models.plain import PlainLocationField

from flamerelay.users.models import User

from .services import send_email_to_subscribers_task

# Create your models here.
# from django.utils.translation import ugettext_lazy as _


class Team(models.Model):
    name = models.SlugField(max_length=32, unique=True)


class CaseInsensitiveCharField(CaseInsensitiveFieldMixin, models.CharField):
    # FYI this class is imported directly in the migration so keep that in mind pls
    def __init__(self, *args, **kwargs):
        super(CaseInsensitiveFieldMixin, self).__init__(*args, **kwargs)


class Unit(models.Model):
    identifier = CaseInsensitiveCharField(
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
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True)
    subscribers = models.ManyToManyField(User, related_name="subscribed_units", blank=True)
    admin_only_checkin = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Unit"
        verbose_name_plural = "Units"

    def __str__(self):
        return self.identifier

    def get_map(self):
        from .services import create_map

        return create_map(self)

    def get_distance_traveled(self):
        # TODO switch the DB to PostGIS and use the distance function
        from .services import distance_traveled_in_km

        return distance_traveled_in_km(self)


def path_and_rename(instance, filename):
    # This omne is in the migrations so keep that in mind pls
    upload_to = "checkins/"
    ext = filename.split(".")[-1]
    filename = f"{uuid4().hex}.{ext}"
    return os.path.join(upload_to, filename)


def validate_not_default_value(value):
    field = CheckIn._meta.get_field("location")  # Replace 'your_field' with the actual field name
    default_value = field.get_default()
    if value == default_value:
        raise ValidationError("Please use the map to drop a pin to where you're making the check-in.")


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
    place = models.CharField(max_length=200, blank=True)
    location = PlainLocationField(zoom=3, default="41.123,5.987", validators=[validate_not_default_value])

    class Meta:
        ordering = ["-date_created"]

    def __str__(self):
        return f"{str(self.unit)} {str(self.date_created)}"

    def send_email_to_subscribers(self, **kwargs):
        subject = f"FlameRelay: New Check In for unit {self.unit.identifier}"
        from_email = "FlameRelay <noreply@flamerelay.org>"

        messages = []
        for user in self.unit.subscribers.all():
            html_message = render_to_string("backend/email_new_checkin.html", {"instance": self, "user": user})

            messages.append(
                {
                    "subject": subject,
                    "message": strip_tags(html_message),
                    "from_email": from_email,
                    "recipient_list": [user.email],
                    "html_message": html_message,
                }
            )
        send_email_to_subscribers_task.delay(messages)


@receiver(post_save, sender=CheckIn)
def send_email_to_subscribers_signal(sender, instance, created, **kwargs):
    if created:
        instance.send_email_to_subscribers(**kwargs)
