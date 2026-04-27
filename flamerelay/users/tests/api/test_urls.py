from django.urls import resolve, reverse


def test_account():
    assert reverse("api:account") == "/api/account/"
    assert resolve("/api/account/").view_name == "api:account"


def test_account_subscriptions():
    assert reverse("api:account-subscriptions") == "/api/account/subscriptions/"
    assert resolve("/api/account/subscriptions/").view_name == "api:account-subscriptions"
