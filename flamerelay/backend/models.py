from django.core.validators import RegexValidator
from django.db import models
from location_field.models.plain import PlainLocationField

from flamerelay.users.models import User

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

    class Meta:
        verbose_name = "Unit"
        verbose_name_plural = "Units"

    def __str__(self):
        return self.identifier

    def get_map(self):
        from .services import create_map

        return create_map(self.checkin_set.order_by("date_created"))


class CheckIn(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT)
    date_created = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    image = models.ImageField(
        upload_to="checkins/",
    )
    message = models.TextField(blank=True)
    city = models.CharField(max_length=255)
    location = PlainLocationField(based_fields=["city"], zoom=2)  # , initial='51.7542,3.01025')

    def __str__(self):
        return f"{str(self.unit)} {str(self.date_created)}"
