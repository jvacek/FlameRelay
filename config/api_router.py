from django.conf import settings
from django.urls import path
from rest_framework.routers import DefaultRouter, SimpleRouter

from backend.api.views import CheckInViewSet, ConfigView, GlobePinsView, StatsView, UnitViewSet
from flamerelay.users.api.views import RequestCodeView, SocialAccountDisconnectView, UserViewSet

router = DefaultRouter() if settings.DEBUG else SimpleRouter()

router.register("users", UserViewSet)

app_name = "api"
urlpatterns = [
    *router.urls,
    path(
        "units/<str:identifier>/",
        UnitViewSet.as_view({"get": "retrieve"}),
        name="unit-detail",
    ),
    path(
        "units/<str:identifier>/checkins/",
        CheckInViewSet.as_view({"get": "list", "post": "create"}),
        name="checkin-list",
    ),
    path(
        "units/<str:identifier>/checkins/<int:pk>/",
        CheckInViewSet.as_view({"patch": "partial_update", "delete": "destroy"}),
        name="checkin-detail",
    ),
    path(
        "units/<str:identifier>/subscribe/",
        UnitViewSet.as_view({"post": "subscribe", "delete": "unsubscribe"}),
        name="unit-subscribe",
    ),
    path("config/", ConfigView.as_view(), name="config"),
    path("stats/", StatsView.as_view(), name="stats"),
    path("globe-pins/", GlobePinsView.as_view(), name="globe-pins"),
    path("auth/code/request/", RequestCodeView.as_view(), name="auth-code-request"),
    path("users/social-accounts/", SocialAccountDisconnectView.as_view(), name="social-account-disconnect"),
]
