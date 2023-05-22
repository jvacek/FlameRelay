from django.contrib import admin

from .models import CheckIn, Team, Unit


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


class CheckInInline(admin.TabularInline):
    model = CheckIn
    extra = 0


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ("id", "identifier", "date_created", "created_by", "team")
    list_filter = ("date_created", "created_by", "team")
    filter_horizontal = ["subscribers"]
    inlines = [CheckInInline]


@admin.action(description="Send email to subscribers")
def send_email_to_subscribers(modeladmin, request, queryset):
    # queryset.update(status="p")
    obj: CheckIn
    for obj in queryset:
        obj.send_email_to_subscribers()


@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "unit",
        "date_created",
        "created_by",
        "image",
        "message",
        "location",
    )
    list_filter = ("unit", "date_created", "created_by")
    actions = [send_email_to_subscribers]
