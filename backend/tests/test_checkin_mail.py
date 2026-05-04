from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from django.contrib.gis.geos import Point
from django.contrib.sites.models import Site
from django.template.loader import render_to_string

from backend.factories import CheckInFactory, UnitFactory
from backend.models import CheckIn
from backend.services import render_thank_you_email
from flamerelay.users.tests.factories import UserFactory

TEMPLATE = "backend/email_new_checkin.html"


@pytest.fixture
def site(db):
    site, _ = Site.objects.get_or_create(id=1, defaults={"domain": "litroute.test", "name": "LitRoute"})
    site.domain = "litroute.test"
    site.save()
    return site


@pytest.fixture
def subscriber(db):
    return UserFactory.create()


@pytest.fixture
def checkin(db, subscriber):
    unit = UnitFactory.create()
    unit.subscribers.add(subscriber)
    return CheckInFactory.create(
        unit=unit,
        message="Just arrived in Paris!",
        place="Paris, France",
        location=Point(2.3522, 48.8566),
    )


def _images_mock_with_url(url: str):
    fake_image = SimpleNamespace(image=SimpleNamespace(url=url))
    m = MagicMock()
    m.first.return_value = fake_image
    return m


class TestEmailNewCheckinTemplate:
    def _render(self, checkin, user, site):
        return render_to_string(TEMPLATE, {"instance": checkin, "user": user, "site": site})

    def test_renders_without_error(self, checkin, subscriber, site):
        assert self._render(checkin, subscriber, site)

    def test_no_img_tag_without_image(self, checkin, subscriber, site):
        assert "<img" not in self._render(checkin, subscriber, site)

    def test_img_tag_with_image(self, checkin, subscriber, site):
        with patch.object(CheckIn, "images", _images_mock_with_url("/media/checkins/test.webp")):
            html = self._render(checkin, subscriber, site)
        assert "<img" in html

    def test_unsubscribe_link_present(self, checkin, subscriber, site):
        assert "action=unsubscribe" in self._render(checkin, subscriber, site)


class TestRenderThankYouEmail:
    def test_renders_without_error(self, checkin, site):
        assert render_thank_you_email(checkin, site)

    def test_no_img_tag_without_image(self, checkin, site):
        assert "<img" not in render_thank_you_email(checkin, site)

    def test_img_tag_with_image(self, checkin, site):
        with patch.object(CheckIn, "images", _images_mock_with_url("/media/checkins/test.webp")):
            html = render_thank_you_email(checkin, site)
        assert "<img" in html

    def test_no_unsubscribe_link(self, checkin, site):
        assert "action=unsubscribe" not in render_thank_you_email(checkin, site)
