from rest_framework import serializers

from flamerelay.users.models import User


class UserSerializer(serializers.ModelSerializer[User]):
    # pyrefly: ignore [bad-override]
    class Meta:
        model = User
        fields = ["username", "name", "url"]

        extra_kwargs = {
            "url": {"view_name": "api:user-detail", "lookup_field": "username"},
        }
