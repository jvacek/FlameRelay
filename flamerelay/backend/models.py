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
                regex=r"^\w{3,}-\d{2,}$",
                message="Identifier must be three or more string characters"
                ", a minus sign, and at least two digits.",
            )
        ],
    )
    date_created = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)

    def __str__(self):
        return self.identifier


class CheckIn(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT)
    date_created = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    image = models.ImageField(
        upload_to="checkins/",
    )
    message = models.TextField(blank=True)
    city = models.CharField(max_length=255)
    location = PlainLocationField(based_fields=["city"], zoom=7)

    def __str__(self):
        return f"{str(self.unit)} {str(self.date_created)}"
