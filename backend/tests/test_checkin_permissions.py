from __future__ import annotations

import pytest
from django.contrib.gis.geos import Point
from rest_framework.test import APIClient

from backend.models import CheckIn, Unit
from flamerelay.users.tests.factories import UserFactory


@pytest.fixture
def unit(db):
    creator = UserFactory.create()
    return Unit.objects.create(identifier="ABC-01", created_by=creator)


LONDON = Point(-0.1278, 51.5074)


def make_checkin(unit, user):
    return CheckIn.objects.create(
        unit=unit,
        created_by=user,
        location=LONDON,
    )


class TestCanUserCheckIn:
    def test_first_checkin_allowed(self, unit):
        user = UserFactory.create()
        assert unit.can_user_check_in(user) is True

    def test_current_holder_can_checkin_again(self, unit):
        user = UserFactory.create()
        make_checkin(unit, user)
        assert unit.can_user_check_in(user) is True

    def test_past_holder_blocked_after_handoff(self, unit):
        user_a = UserFactory.create()
        user_b = UserFactory.create()
        make_checkin(unit, user_a)
        make_checkin(unit, user_b)
        assert unit.can_user_check_in(user_a) is False

    def test_new_user_allowed_when_unit_has_checkins(self, unit):
        existing_user = UserFactory.create()
        make_checkin(unit, existing_user)
        new_user = UserFactory.create()
        assert unit.can_user_check_in(new_user) is True

    def test_superuser_always_allowed(self, unit):
        user_a = UserFactory.create()
        user_b = UserFactory.create()
        superuser = UserFactory.create(is_superuser=True)
        make_checkin(unit, user_a)
        make_checkin(unit, user_b)
        make_checkin(unit, user_a)  # user_a was current holder, now blocked
        assert unit.can_user_check_in(superuser) is True


class TestCheckinCreateAPI:
    @pytest.fixture
    def client(self):
        return APIClient()

    def test_past_holder_gets_403(self, unit, client):
        user_a = UserFactory.create()
        user_b = UserFactory.create()
        make_checkin(unit, user_a)
        make_checkin(unit, user_b)

        client.force_authenticate(user=user_a)
        res = client.post(
            f"/api/units/{unit.identifier}/checkins/",
            {"location": {"type": "Point", "coordinates": [-0.1278, 51.5074]}, "message": "sneaky"},
            format="json",
        )
        assert res.status_code == 403  # noqa: PLR2004

    def test_current_holder_gets_201(self, unit, client):
        user = UserFactory.create()
        make_checkin(unit, user)

        client.force_authenticate(user=user)
        res = client.post(
            f"/api/units/{unit.identifier}/checkins/",
            {"location": {"type": "Point", "coordinates": [-0.1278, 51.5074]}},
            format="json",
        )
        assert res.status_code == 201  # noqa: PLR2004

    def test_new_user_gets_201(self, unit, client):
        existing = UserFactory.create()
        make_checkin(unit, existing)

        new_user = UserFactory.create()
        client.force_authenticate(user=new_user)
        res = client.post(
            f"/api/units/{unit.identifier}/checkins/",
            {"location": {"type": "Point", "coordinates": [-0.1278, 51.5074]}},
            format="json",
        )
        assert res.status_code == 201  # noqa: PLR2004

    def test_superuser_past_holder_gets_201(self, unit, client):
        superuser = UserFactory.create(is_superuser=True)
        other = UserFactory.create()
        make_checkin(unit, superuser)
        make_checkin(unit, other)

        client.force_authenticate(user=superuser)
        res = client.post(
            f"/api/units/{unit.identifier}/checkins/",
            {"location": {"type": "Point", "coordinates": [-0.1278, 51.5074]}},
            format="json",
        )
        assert res.status_code == 201  # noqa: PLR2004
