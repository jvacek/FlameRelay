from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.messages.views import SuccessMessageMixin
from django.utils.translation import gettext_lazy as _
from django.views.generic import TemplateView, UpdateView

from flamerelay.users.models import User

if TYPE_CHECKING:
    from django.db.models import QuerySet


login_view = TemplateView.as_view(template_name="account/login.html")
signup_view = TemplateView.as_view(template_name="account/signup.html")
email_confirm_view = TemplateView.as_view(template_name="account/email_confirm.html")


class UserProfileView(LoginRequiredMixin, TemplateView):
    template_name = "users/user_detail.html"


user_profile_view = UserProfileView.as_view()


class UserUpdateView(LoginRequiredMixin, SuccessMessageMixin, UpdateView):
    model = User
    fields = ["name"]
    success_message = _("Information successfully updated")

    def get_success_url(self) -> str:
        return "/profile/"

    def get_object(self, queryset: QuerySet | None = None) -> User:
        assert self.request.user.is_authenticated  # type guard
        # pyrefly: ignore [bad-return]
        return self.request.user


user_update_view = UserUpdateView.as_view()


class UserSettingsView(LoginRequiredMixin, TemplateView):
    template_name = "users/user_settings.html"


user_settings_view = UserSettingsView.as_view()
