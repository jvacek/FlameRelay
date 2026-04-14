from django.conf import settings
from django.urls import path
from rest_framework.routers import DefaultRouter, SimpleRouter

from backend.api.views import CheckInViewSet, StatsView, UnitViewSet
from flamerelay.users.api.views import UserViewSet

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
    path("stats/", StatsView.as_view(), name="stats"),
]
