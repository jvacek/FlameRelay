from __future__ import annotations

from django.urls import resolve, reverse


def test_profile():
    assert reverse("users:profile") == "/profile/"
    assert resolve("/profile/").view_name == "users:profile"


def test_settings():
    assert reverse("users:settings") == "/profile/settings/"
    assert resolve("/profile/settings/").view_name == "users:settings"


def test_update():
    assert reverse("users:update") == "/profile/update/"
    assert resolve("/profile/update/").view_name == "users:update"
