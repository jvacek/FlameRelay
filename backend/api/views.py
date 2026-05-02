from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.mixins import (
    CreateModelMixin,
    DestroyModelMixin,
    ListModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
)
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet

from backend.models import CheckIn, Unit
from config.constants import (
    CHECKIN_DEFAULT_LOCATION,
    CHECKIN_DELETE_GRACE_PERIOD_HOURS,
    CHECKIN_EDIT_GRACE_PERIOD_HOURS,
    GLOBE_PINS_CACHE_KEY,
    GLOBE_PINS_CACHE_TTL,
    GLOBE_PINS_COUNT,
    STATS_CACHE_KEY,
    STATS_CACHE_TTL,
)

from .serializers import CheckInSerializer, UnitSerializer

User = get_user_model()


class ConfigView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        responses=inline_serializer(
            name="Config",
            fields={
                "maptilerKey": serializers.CharField(),
                "allowRegistration": serializers.BooleanField(),
            },
        )
    )
    def get(self, request) -> Response:
        return Response(
            {
                "maptilerKey": settings.MAPTILER_KEY,
                "allowRegistration": settings.ACCOUNT_ALLOW_REGISTRATION,
            }
        )


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


class GlobePinsView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        responses=inline_serializer(
            name="GlobePins",
            fields={
                "pins": serializers.ListField(
                    child=inline_serializer(
                        name="GlobePin",
                        fields={
                            "lat": serializers.FloatField(),
                            "lng": serializers.FloatField(),
                        },
                    )
                )
            },
        )
    )
    def get(self, request) -> Response:
        from django.db.models import OuterRef, Subquery  # noqa: PLC0415

        pins = cache.get(GLOBE_PINS_CACHE_KEY)
        if pins is None:
            latest_location_sq = (
                CheckIn.objects.filter(unit=OuterRef("pk")).order_by("-date_created").values("location")[:1]
            )
            latest_date_sq = (
                CheckIn.objects.filter(unit=OuterRef("pk")).order_by("-date_created").values("date_created")[:1]
            )
            locations = (
                Unit.objects.exclude(admin_only_checkin=True)
                .annotate(checkin_count=Count("checkin"))
                .exclude(checkin_count__lte=1)
                .annotate(latest_location=Subquery(latest_location_sq))
                .annotate(latest_date=Subquery(latest_date_sq))
                .exclude(latest_location__isnull=True)
                .exclude(latest_location=CHECKIN_DEFAULT_LOCATION)
                .order_by("-latest_date")
                .values_list("latest_location", flat=True)[:GLOBE_PINS_COUNT]
            )
            pins = []
            for loc in locations:
                try:
                    lat_str, lng_str = loc.split(",", 1)
                    pins.append({"lat": float(lat_str), "lng": float(lng_str)})
                except ValueError, AttributeError:
                    continue
            cache.set(GLOBE_PINS_CACHE_KEY, pins, GLOBE_PINS_CACHE_TTL)
        return Response({"pins": pins})


class LocationClaimView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=inline_serializer(
            name="LocationClaimRequest",
            fields={
                "lat": serializers.FloatField(),
                "lng": serializers.FloatField(),
                "accuracy": serializers.FloatField(),
            },
        ),
        responses=inline_serializer(
            name="LocationClaimResponse",
            fields={"token": serializers.CharField()},
        ),
    )
    def post(self, request) -> Response:
        from backend.location_token import issue_location_claim  # noqa: PLC0415

        try:
            lat = float(request.data["lat"])
            lng = float(request.data["lng"])
            accuracy = float(request.data["accuracy"])
        except KeyError, TypeError, ValueError:
            return Response(
                {"detail": "lat, lng, and accuracy are required numeric fields."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        token = issue_location_claim(lat, lng, accuracy, request.user.id)
        return Response({"token": token})


class UnitViewSet(RetrieveModelMixin, GenericViewSet):
    serializer_class = UnitSerializer
    lookup_field = "identifier"
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Unit.objects.annotate(
        checkin_count=Count("checkin", distinct=True),
        subscriber_count=Count("subscribers", distinct=True),
    )

    def get_permissions(self):
        # subscribe/unsubscribe handle auth manually to return 401 (not 403).
        # IsAuthenticatedOrReadOnly would return 403 when SessionAuthentication
        # is the primary authenticator because it has no authenticate_header().
        if self.action in ("subscribe", "unsubscribe"):
            return [AllowAny()]
        return super().get_permissions()

    @extend_schema(request=None, responses={204: None, 401: None}, auth=[{"cookieAuth": []}])
    def subscribe(self, request, identifier=None):
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        unit = get_object_or_404(Unit, identifier=identifier)
        unit.subscribers.add(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(request=None, responses={204: None, 401: None}, auth=[{"cookieAuth": []}])
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
        from backend.location_token import verify_location_claim  # noqa: PLC0415
        from backend.services import unit_distance_cache_key  # noqa: PLC0415

        unit = get_object_or_404(Unit, identifier=self.kwargs["identifier"])
        if unit.admin_only_checkin and not (self.request.user.is_superuser or self.request.user.is_staff):
            msg = "This unit can only be checked in by admins."
            raise PermissionDenied(msg)
        if not unit.can_user_check_in(self.request.user):
            msg = (
                "You can't check in here \u2014 once someone else takes the lighter, "
                "its journey moves on. You can still follow along by subscribing."
            )
            raise PermissionDenied(msg)
        if unit.is_gps_location_enforced:
            token = self.request.data.get("location_token")
            if not token:
                raise ValidationError({"location_token": "Required for this unit."})
            location = serializer.validated_data.get("location", "")
            try:
                lat_str, lng_str = location.split(",", 1)
                lat, lng = float(lat_str), float(lng_str)
            except ValueError as exc:
                raise ValidationError({"location": "Invalid location format."}) from exc
            try:
                verify_location_claim(token, self.request.user.id, lat, lng)
            except ValueError as exc:
                raise ValidationError({"location_token": str(exc)}) from exc
        serializer.save(created_by=self.request.user, unit=unit)
        unit.subscribers.add(self.request.user)
        cache.delete_many([unit_distance_cache_key(unit.identifier), STATS_CACHE_KEY, GLOBE_PINS_CACHE_KEY])

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

    def perform_destroy(self, instance):
        from backend.services import unit_distance_cache_key  # noqa: PLC0415

        unit_identifier = instance.unit.identifier
        super().perform_destroy(instance)
        cache.delete_many([unit_distance_cache_key(unit_identifier), STATS_CACHE_KEY, GLOBE_PINS_CACHE_KEY])
