from django.contrib import admin

from .models import CheckIn, Unit


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ("id", "identifier", "date_created", "created_by")
    list_filter = ("date_created", "created_by")
    filter_horizontal = ["subscribers"]


@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "unit",
        "date_created",
        "created_by",
        "image",
        "message",
        "city",
        "location",
    )
    list_filter = ("unit", "date_created", "created_by")
