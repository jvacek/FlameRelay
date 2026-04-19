from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from backend.models import CheckIn, Unit
from config.constants import CHECKIN_EDIT_GRACE_PERIOD_HOURS


class CheckInSerializer(serializers.ModelSerializer):
    within_edit_grace_period = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)

    class Meta:
        model = CheckIn
        fields = [
            "id",
            "date_created",
            "created_by_username",
            "created_by_name",
            "image",
            "message",
            "place",
            "location",
            "within_edit_grace_period",
        ]
        read_only_fields = ["id", "date_created", "created_by_username", "created_by_name", "within_edit_grace_period"]

    def get_within_edit_grace_period(self, obj: CheckIn) -> bool:
        return obj.date_created >= timezone.now() - timedelta(hours=CHECKIN_EDIT_GRACE_PERIOD_HOURS)


class UnitSerializer(serializers.ModelSerializer):
    checkin_count = serializers.IntegerField(read_only=True)
    subscriber_count = serializers.IntegerField(read_only=True)
    distance_traveled_km = serializers.SerializerMethodField()
    is_subscribed = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = [
            "identifier",
            "date_created",
            "admin_only_checkin",
            "team",
            "checkin_count",
            "subscriber_count",
            "distance_traveled_km",
            "is_subscribed",
        ]

    def get_distance_traveled_km(self, obj: Unit) -> float:
        return obj.get_distance_traveled()

    def get_is_subscribed(self, obj: Unit) -> bool:
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.subscribers.filter(id=request.user.id).exists()
        return False
