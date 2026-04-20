from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from django.contrib import messages
from django.contrib.messages.middleware import MessageMiddleware
from django.contrib.sessions.middleware import SessionMiddleware
from django.utils.translation import gettext_lazy as _

from flamerelay.users.forms import UserAdminChangeForm
from flamerelay.users.views import UserUpdateView

if TYPE_CHECKING:
    from django.http import HttpRequest
    from django.test import RequestFactory

    from flamerelay.users.models import User

pytestmark = pytest.mark.django_db


class TestUserUpdateView:
    def dummy_get_response(self, request: HttpRequest):
        return None

    def test_get_success_url(self, user: User, rf: RequestFactory):
        view = UserUpdateView()
        request = rf.get("/fake-url/")
        request.user = user

        view.request = request
        assert view.get_success_url() == "/profile/"

    def test_get_object(self, user: User, rf: RequestFactory):
        view = UserUpdateView()
        request = rf.get("/fake-url/")
        request.user = user

        view.request = request

        assert view.get_object() == user

    def test_form_valid(self, user: User, rf: RequestFactory):
        view = UserUpdateView()
        request = rf.get("/fake-url/")

        # Add the session/message middleware to the request
        # pyrefly: ignore [bad-argument-type]
        SessionMiddleware(self.dummy_get_response).process_request(request)
        # pyrefly: ignore [bad-argument-type]
        MessageMiddleware(self.dummy_get_response).process_request(request)
        request.user = user

        view.request = request

        # Initialize the form
        form = UserAdminChangeForm()
        form.cleaned_data = {}
        form.instance = user
        view.form_valid(form)

        messages_sent = [m.message for m in messages.get_messages(request)]
        assert messages_sent == [_("Information successfully updated")]
