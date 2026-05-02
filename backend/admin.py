from django.contrib import admin

from .models import CheckIn, Game, Team, Unit


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ("id", "mode", "allowed_time", "max_gps_drift", "shelf_life")
    list_filter = ("mode",)


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

    def _is_contributor(self, request):
        return not request.user.is_superuser and request.user.groups.filter(name="contributor").exists()

    def get_readonly_fields(self, request, obj=None):
        if self._is_contributor(request):
            fields = ["created_by"]
            if obj is not None and obj.checkin_set.exists():
                fields.append("identifier")
            return fields
        return []

    def has_delete_permission(self, request, obj=None):
        if self._is_contributor(request):
            # obj=None means the changelist bulk-delete action — disallow it
            return obj is not None and not obj.checkin_set.exists()
        return super().has_delete_permission(request, obj)

    def get_exclude(self, request, obj=None):
        if self._is_contributor(request):
            return ["subscribers"]
        return super().get_exclude(request, obj)

    def get_list_filter(self, request):
        if self._is_contributor(request):
            return ["date_created", "team"]
        return ["date_created", "created_by", "team"]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if self._is_contributor(request):
            return qs.filter(created_by=request.user)
        return qs

    def get_fieldsets(self, request, obj=None):
        if not self._is_contributor(request):
            return super().get_fieldsets(request, obj)
        description = (
            "You can only see and edit units you created. "
            "Once a unit has a check-in, its identifier is locked and the unit cannot be deleted. "
            "Units with no check-ins can be deleted from this page."
        )
        return [
            (
                None,
                {
                    "fields": ["identifier", "team", "game", "admin_only_checkin", "created_by"],
                    "description": description,
                },
            )
        ]

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context["is_contributor"] = self._is_contributor(request)
        return super().changelist_view(request, extra_context)

    def save_model(self, request, obj, form, change):
        if not change and self._is_contributor(request):
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


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
        "place",
        # "image",
        # "message",
        # "location",
    )
    list_filter = ("unit", "date_created", "created_by")
    actions = [send_email_to_subscribers]
