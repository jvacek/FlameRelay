from __future__ import annotations

import typing

from allauth.account.adapter import DefaultAccountAdapter
from allauth.mfa.adapter import DefaultMFAAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings

if typing.TYPE_CHECKING:
    from allauth.socialaccount.models import SocialLogin
    from django.http import HttpRequest

    from flamerelay.users.models import User


class MFAAdapter(DefaultMFAAdapter):
    def _get_site_name(self) -> str:
        return "LitRoute"


class AccountAdapter(DefaultAccountAdapter):
    # pyrefly: ignore [bad-override]
    def is_open_for_signup(self, request: HttpRequest) -> bool:
        return getattr(settings, "ACCOUNT_ALLOW_REGISTRATION", True)


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    # pyrefly: ignore [bad-override]
    def is_open_for_signup(
        self,
        request: HttpRequest,
        sociallogin: SocialLogin,
    ) -> bool:
        return getattr(settings, "ACCOUNT_ALLOW_REGISTRATION", True)

    def populate_user(
        self,
        request: HttpRequest,
        sociallogin: SocialLogin,
        data: dict[str, typing.Any],
    ) -> User:
        user = super().populate_user(request, sociallogin, data)
        if not sociallogin.is_existing:
            # New social users get a blank name so Login.tsx prompts them to
            # choose a display name via the name step.
            user.name = ""
        return user
