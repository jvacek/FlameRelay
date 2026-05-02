from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import patch

import pytest
from allauth.account.models import EmailAddress
from allauth.mfa.models import Authenticator
from allauth.socialaccount.models import SocialAccount
from rest_framework import status
from rest_framework.test import APIClient

from backend.factories import CheckInFactory, UnitFactory
from flamerelay.users.services import anonymize_user

if TYPE_CHECKING:
    from flamerelay.users.models import User


@pytest.mark.django_db
class TestAccountView:
    def test_get(self, user: User):
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get("/api/account/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data == {
            "username": user.username,
            "name": user.name,
            "is_superuser": False,
            "admin_url": None,
        }

    def test_get_requires_auth(self):
        client = APIClient()
        response = client.get("/api/account/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_patch(self, user: User):
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.patch("/api/account/", {"name": "New Name"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "New Name"
        user.refresh_from_db()
        assert user.name == "New Name"

    def test_patch_requires_auth(self):
        client = APIClient()
        response = client.patch("/api/account/", {"name": "x"}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestDeleteAccount:
    def test_anonymize_user_fields(self, user: User):
        with patch("django.core.files.storage.default_storage.delete"):
            anonymize_user(user)

        user.refresh_from_db()
        assert user.email.startswith("deleted_")
        assert user.email.endswith("@deleted.invalid")
        assert user.username.startswith("deleted_")
        assert user.name == ""
        assert user.is_active is False

    def test_anonymize_clears_allauth_rows(self, user: User):
        EmailAddress.objects.create(user=user, email=user.email, verified=True, primary=True)
        SocialAccount.objects.create(user=user, provider="google", uid="123")
        Authenticator.objects.create(user=user, type=Authenticator.Type.TOTP, data={})

        with patch("django.core.files.storage.default_storage.delete"):
            anonymize_user(user)

        assert not EmailAddress.objects.filter(user=user).exists()
        assert not SocialAccount.objects.filter(user=user).exists()
        assert not Authenticator.objects.filter(user=user).exists()

    def test_anonymize_clears_checkin_content(self, user: User):
        unit = UnitFactory.create()
        checkin = CheckInFactory.create(created_by=user, unit=unit, message="hello", image="checkins/test.jpg")

        with patch("django.core.files.storage.default_storage.delete"):
            anonymize_user(user)

        checkin.refresh_from_db()
        assert checkin.message == ""
        assert checkin.image.name == "" or not checkin.image

    def test_anonymize_deletes_image_files(self, user: User):
        unit = UnitFactory.create()
        CheckInFactory.create(created_by=user, unit=unit, image="checkins/test.jpg")

        with patch("django.core.files.storage.default_storage.delete") as mock_delete:
            anonymize_user(user)

        mock_delete.assert_called_once_with("checkins/test.jpg")

    def test_anonymize_removes_subscriptions(self, user: User):
        unit = UnitFactory.create()
        unit.subscribers.add(user)

        with patch("django.core.files.storage.default_storage.delete"):
            anonymize_user(user)

        assert not unit.subscribers.filter(pk=user.pk).exists()

    def test_delete_me_endpoint_returns_204(self, user: User):
        client = APIClient()
        client.force_authenticate(user=user)
        with patch("django.core.files.storage.default_storage.delete"):
            response = client.delete("/api/account/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_delete_me_requires_auth(self):
        client = APIClient()
        response = client.delete("/api/account/")
        assert response.status_code == status.HTTP_403_FORBIDDEN
