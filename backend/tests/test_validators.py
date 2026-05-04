import pytest
from django.core.exceptions import ValidationError

from backend.models import validate_no_urls


class TestValidateNoUrls:
    @pytest.mark.parametrize(
        "message",
        [
            "Found it near the old market!",
            "",
        ],
    )
    def test_valid_messages_pass(self, message):
        validate_no_urls(message)

    @pytest.mark.parametrize(
        ("message", "expected_match"),
        [
            ("check this https://spam.com out", r"https://spam\.com"),
            ("http://x.io", r"http://x\.io"),
            ("visit www.example.com", r"www\.example\.com"),
            ("check asdaasd.xyz/asd", r"asdaasd\.xyz/asd"),
            ("check spam(.)xyz/path", r"spam\.xyz/path"),
            ("check spam[.]xyz/path", r"spam\.xyz/path"),
            ("check spam{.}xyz/path", r"spam\.xyz/path"),
            ("check spam[ . ]xyz/path", r"spam\.xyz/path"),
            ("https:\u200b//spam.com", r"https://spam\.com"),  # zero-width space
            ("https://spa\xadm.com", r"https://spam\.com"),  # soft hyphen
        ],
    )
    def test_invalid_messages_raise(self, message, expected_match):
        with pytest.raises(ValidationError, match=expected_match):
            validate_no_urls(message)
