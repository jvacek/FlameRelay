import os
from uuid import uuid4

from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django_case_insensitive_field import CaseInsensitiveFieldMixin
from django_resized import ResizedImageField
from location_field.models.plain import PlainLocationField

from config.constants import CHECKIN_IMAGE_MAX_UPLOAD_BYTES
from flamerelay.users.models import User

from .services import send_email_to_subscribers_task, send_thank_you_email_task

# Create your models here.
# from django.utils.translation import ugettext_lazy as _


class Team(models.Model):
    name = models.SlugField(max_length=32, unique=True)

    def __str__(self):
        return self.name


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

    def can_user_check_in(self, user) -> bool:
        if user.is_superuser:
            return True
        qs = self.checkin_set.order_by("-date_created")
        last = qs.first()
        if last is not None and last.created_by_id != user.pk:
            return not qs.filter(created_by=user).exists()
        return True

    def get_distance_traveled(self) -> float:
        from django.core.cache import cache  # noqa: PLC0415

        from config.constants import UNIT_DISTANCE_CACHE_TTL  # noqa: PLC0415

        from .services import distance_traveled_in_km, unit_distance_cache_key  # noqa: PLC0415

        key = unit_distance_cache_key(self.identifier)
        cached = cache.get(key)
        if cached is None:
            cached = distance_traveled_in_km(self)
            cache.set(key, cached, UNIT_DISTANCE_CACHE_TTL)
        return cached


def path_and_rename(instance, filename):
    # This omne is in the migrations so keep that in mind pls
    upload_to = "checkins/"
    ext = filename.split(".")[-1]
    filename = f"{uuid4().hex}.{ext}"
    return os.path.join(upload_to, filename)  # noqa: PTH118


def validate_image_size(value):
    if value and value.size > CHECKIN_IMAGE_MAX_UPLOAD_BYTES:
        mb = CHECKIN_IMAGE_MAX_UPLOAD_BYTES // (1024 * 1024)
        msg = f"Image file too large. Maximum size is {mb} MB."
        raise ValidationError(msg)


def validate_not_default_value(value):
    field = CheckIn._meta.get_field("location")  # Replace 'your_field' with the actual field name  # noqa: SLF001
    default_value = field.get_default()
    if value == default_value:
        msg = "Please use the map to drop a pin to where you're making the check-in."
        raise ValidationError(msg)


class CheckIn(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE)
    date_created = models.DateTimeField(editable=False, default=timezone.now)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    image = ResizedImageField(
        # upload_to="checkins/",
        upload_to=path_and_rename,
        blank=True,
        null=True,
        size=[1024, 1024],
        validators=[validate_image_size],
    )
    message = models.TextField(blank=True)
    place = models.CharField(max_length=200, blank=True)
    location = PlainLocationField(zoom=3, default="41.123,5.987", validators=[validate_not_default_value])

    class Meta:
        ordering = ["-date_created"]

    def __str__(self):
        return f"{self.unit!s} {self.date_created!s}"

    def send_email_to_subscribers(self, **kwargs):
        from django.conf import settings  # noqa: PLC0415

        from config.constants import CHECKIN_EMAIL_DELAY_SECONDS  # noqa: PLC0415

        countdown = 0 if settings.DEBUG else CHECKIN_EMAIL_DELAY_SECONDS
        send_email_to_subscribers_task.apply_async(args=[self.pk], countdown=countdown)
        send_thank_you_email_task.apply_async(args=[self.pk], countdown=countdown)


@receiver(post_save, sender=CheckIn)
def send_email_to_subscribers_signal(sender, instance, created, **kwargs):
    if created:
        instance.send_email_to_subscribers(**kwargs)
