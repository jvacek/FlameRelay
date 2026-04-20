from django.conf import settings
from rest_framework import serializers

from flamerelay.users.models import User


class UserSerializer(serializers.ModelSerializer[User]):
    admin_url = serializers.SerializerMethodField()

    def get_admin_url(self, obj: User) -> str | None:
        if obj.is_superuser:
            return f"/{settings.ADMIN_URL}"
        return None

    # pyrefly: ignore [bad-override]
    class Meta:
        model = User
        fields = ["username", "name", "url", "is_superuser", "admin_url"]
        read_only_fields = ["username", "is_superuser", "admin_url"]

        extra_kwargs = {
            "url": {"view_name": "api:user-detail", "lookup_field": "username"},
        }
