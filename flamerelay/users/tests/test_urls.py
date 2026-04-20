from __future__ import annotations

from django.urls import resolve


def test_profile_serves_spa():
    assert resolve("/profile/").view_name == "spa"


def test_settings_serves_spa():
    assert resolve("/profile/settings/").view_name == "spa"


def test_update_serves_spa():
    assert resolve("/profile/update/").view_name == "spa"
