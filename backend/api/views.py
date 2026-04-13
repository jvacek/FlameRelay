from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.mixins import (
    CreateModelMixin,
    DestroyModelMixin,
    ListModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
)
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet

from backend.models import CheckIn, Unit
from config.constants import (
    CHECKIN_DELETE_GRACE_PERIOD_HOURS,
    CHECKIN_EDIT_GRACE_PERIOD_HOURS,
    STATS_CACHE_TTL,
)

from .serializers import CheckInSerializer, UnitSerializer

User = get_user_model()

STATS_CACHE_KEY = "api:stats"


class StatsView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        responses=inline_serializer(
            name="Stats",
            fields={
                "active_unit_count": serializers.IntegerField(),
                "checkin_count": serializers.IntegerField(),
                "contributing_user_count": serializers.IntegerField(),
                "total_distance_traveled_km": serializers.FloatField(),
            },
        )
    )
    def get(self, request) -> Response:
        from backend.services import total_distance_traveled_in_km  # noqa: PLC0415

        stats = cache.get(STATS_CACHE_KEY)
        if stats is None:
            stats = {
                "active_unit_count": Unit.objects.exclude(admin_only_checkin=True)
                .annotate(checkin_count=Count("checkin"))
                .exclude(checkin_count__lte=1)
                .count(),
                "checkin_count": CheckIn.objects.count(),
                "contributing_user_count": User.objects.annotate(checkin_count=Count("checkin"))
                .filter(checkin_count__gte=1)
                .count(),
                "total_distance_traveled_km": total_distance_traveled_in_km(),
            }
            cache.set(STATS_CACHE_KEY, stats, STATS_CACHE_TTL)
        return Response(stats)


class UnitViewSet(RetrieveModelMixin, GenericViewSet):
    serializer_class = UnitSerializer
    lookup_field = "identifier"
    queryset = Unit.objects.annotate(
        checkin_count=Count("checkin", distinct=True),
        subscriber_count=Count("subscribers", distinct=True),
    )

    @extend_schema(request=None, responses={204: None, 401: None})
    def subscribe(self, request, identifier=None):
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        unit = get_object_or_404(Unit, identifier=identifier)
        unit.subscribers.add(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(request=None, responses={204: None, 401: None})
    def unsubscribe(self, request, identifier=None):
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        unit = get_object_or_404(Unit, identifier=identifier)
        unit.subscribers.remove(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CheckInViewSet(ListModelMixin, CreateModelMixin, UpdateModelMixin, DestroyModelMixin, GenericViewSet):
    serializer_class = CheckInSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return CheckIn.objects.filter(unit__identifier=self.kwargs["identifier"])

    def perform_create(self, serializer):
        from backend.services import unit_distance_cache_key  # noqa: PLC0415

        unit = get_object_or_404(Unit, identifier=self.kwargs["identifier"])
        if unit.admin_only_checkin and not (self.request.user.is_superuser or self.request.user.is_staff):
            msg = "This unit can only be checked in by admins."
            raise PermissionDenied(msg)
        serializer.save(created_by=self.request.user, unit=unit)
        unit.subscribers.add(self.request.user)
        cache.delete_many([unit_distance_cache_key(unit.identifier), STATS_CACHE_KEY])

    def partial_update(self, request, *args, **kwargs):
        checkin = self.get_object()
        if checkin.created_by != request.user:
            msg = "You can only edit your own check-ins."
            raise PermissionDenied(msg)
        if checkin.date_created < timezone.now() - timedelta(hours=CHECKIN_EDIT_GRACE_PERIOD_HOURS):
            msg = f"Cannot edit check-ins after {CHECKIN_EDIT_GRACE_PERIOD_HOURS} hours."
            raise PermissionDenied(msg)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        checkin = self.get_object()
        if checkin.created_by != request.user:
            msg = "You can only delete your own check-ins."
            raise PermissionDenied(msg)
        if checkin.date_created < timezone.now() - timedelta(hours=CHECKIN_DELETE_GRACE_PERIOD_HOURS):
            msg = f"Cannot delete check-ins after {CHECKIN_DELETE_GRACE_PERIOD_HOURS} hours."
            raise PermissionDenied(msg)
        return super().destroy(request, *args, **kwargs)
