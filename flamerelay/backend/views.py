from datetime import timedelta

from captcha.fields import CaptchaField
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Div, Layout
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.db.models import (
    BooleanField,
    Case,
    CharField,
    Count,
    DurationField,
    ExpressionWrapper,
    F,
    Prefetch,
    Value,
    When,
    Window,
)
from django.db.models.functions import Concat, ExtractDay, ExtractHour, Lag
from django.forms import ModelForm
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone

from .models import CheckIn, Unit

# View for the unit page

EDIT_GRACE_PERIOD_HOURS = 6
User = get_user_model()


def homepage_view(request):
    # This doesn't really belong here but ¯\_(ツ)_/¯
    return render(
        request,
        "pages/home.html",
        context={
            "active_lighter_count": Unit.objects.exclude(admin_only_checkin=True)
            .annotate(checkin_count=Count("checkin"))
            .exclude(checkin_count__lte=1)
            .count(),
            "checkin_count": CheckIn.objects.count(),
            "contributing_users": User.objects.annotate(checkin_count=Count("checkin"))
            .filter(checkin_count__lte=1)
            .count(),
        },
    )


def unit_lookup_view(request):
    if not request.GET.get("identifier", ""):
        return redirect(reverse("backend:unit", kwargs={"identifier": "test-123"}))
    identifier = request.GET["identifier"]
    print(identifier)
    return redirect(reverse("backend:unit", kwargs={"identifier": identifier}))


def unit_view(request, identifier):
    # TODO move to model as an actual defined QSet, write unit test
    threshold = timezone.now() - timedelta(hours=EDIT_GRACE_PERIOD_HOURS)

    checkin_qs = CheckIn.objects.annotate(
        within_edit_grace_period=Case(
            When(date_created__gte=threshold, then=True), default=False, output_field=BooleanField()
        ),
        previous_date_created=Window(expression=Lag("date_created"), order_by=F("date_created").asc()),
        duration=ExpressionWrapper(F("date_created") - F("previous_date_created"), output_field=DurationField()),
        duration_in_days=ExtractDay(F("duration")),
        duration_in_hours=ExtractHour(F("duration")),
        duration_text=Case(
            When(duration__isnull=True, then=Value("Initial")),
            When(duration_in_days__gt=0, then=Concat("duration_in_days", Value(" days"))),
            When(duration_in_hours__gt=0, then=Concat("duration_in_hours", Value(" hours"))),
            default=Value("A moment"),
            output_field=CharField(),
        ),
    )
    unit_qs = Unit.objects.prefetch_related(
        Prefetch("checkin_set", queryset=checkin_qs, to_attr="annotated_checkin_set")
    )
    unit = get_object_or_404(unit_qs, identifier=identifier)

    if "action" in request.GET:
        if not request.user.is_authenticated:
            messages.warning(request, "You must be logged in to subscribe to a unit.")
            return redirect(reverse("account_login") + "?next=" + request.path)

        if request.GET["action"] == "unsubscribe":
            unit.subscribers.remove(request.user)
            messages.success(request, "You are now unsubscribed from this unit.")
        elif request.GET["action"] == "subscribe":
            unit.subscribers.add(request.user)
            messages.success(request, "You are now subscribed to this unit.")
        return redirect(reverse("backend:unit", kwargs={"identifier": identifier}))

    map_html = unit.get_map()._repr_html_()
    return render(request, "backend/unit.html", {"unit": unit, "map_html": map_html})


class CheckInForm(ModelForm):
    captcha = CaptchaField()

    class Meta:
        model = CheckIn
        fields = [
            # "unit",
            # "date_created",
            # "created_by",
            "image",
            "message",
            "location",
            "place",
        ]
        help_texts = {
            "image": "Upload an image of the lighter in its current location.",
            "message": "Write a litte message about the journey since the last check-in! Maybe where you found it"
            ", how you got to where you are, or what you're planning to do next.",
            "place": 'An indication of where this is, e.g. "Grande Place, Brussels", "Grand Canyon", etc.',
            "location": "Use the map to drop a pin to where you're making the check-in.",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper(self)
        self.helper.form_tag = False
        self.helper.layout = Layout(
            Div(
                Div("image", "message", css_class="col-sm-6"),  # Set the column width (e.g., col-sm-6)
                Div("place", "location", css_class="col-sm-6"),  # Set the column width (e.g., col-sm-6)
                Div("captcha", css_class="col-sm-6"),
                css_class="row",
            )
        )


# A view for the CheckIn object creation using a form
@login_required
def checkin_create_view(request, identifier):
    unit = get_object_or_404(Unit, identifier=identifier)
    if unit.admin_only_checkin and (not request.user.is_superuser or not request.user.is_staff):
        messages.warning(request, "This specific unit can only be checked in by admins.")
        return redirect(reverse("backend:unit", kwargs={"identifier": identifier}))

    form = CheckInForm(request.POST or None, request.FILES or None)
    if form.is_valid():
        form.unit = unit
        form.created_by = request.user
        form.cleaned_data.pop("captcha")
        CheckIn.objects.create(
            created_by=request.user,
            unit=unit,
            **form.cleaned_data,
        )
        unit.subscribers.add(request.user)
        unit.save()
        messages.success(request, "Check-in created! You're subscribed to new updates as well.")
        return redirect(reverse("backend:unit", kwargs={"identifier": unit.identifier}))

    context = {
        "form": form,
        "unit": unit,
    }
    return render(request, "backend/checkin_edit.html", context)


@login_required
def checkin_edit_view(request, identifier, checkin_id):
    checkin = get_object_or_404(CheckIn, id=checkin_id)
    unit = get_object_or_404(Unit, identifier=identifier)

    if checkin.created_by != request.user:
        messages.warning(request, "You can only edit your own checkins.")
        return redirect(reverse("backend:unit", kwargs={"identifier": identifier}))

    if checkin.date_created < timezone.now() - timedelta(hours=6):
        messages.warning(request, "You cannot edit checkins after 6 hours.")
        return redirect(reverse("backend:unit", kwargs={"identifier": identifier}))

    form = CheckInForm(request.POST or None, request.FILES or None, initial=checkin.__dict__)
    if form.is_valid():
        form.cleaned_data.pop("captcha")
        print(form.cleaned_data)
        for key, value in form.cleaned_data.items():
            setattr(checkin, key, value)
        checkin.save()
        messages.success(request, "Check-in saved correctly!")
        return redirect(reverse("backend:unit", kwargs={"identifier": unit.identifier}))

    context = {
        "form": form,
        "unit": unit,
        "checkin": checkin,
    }
    return render(request, "backend/checkin_edit.html", context)


# TODO see if this could be fun
# def leaderboards_view(request):
# from django.utils import timezone
#     units = Unit.objects.all()
#     # 10 units with most checkins
#     units_top_checkins = sorted(units, key=lambda x: len(x.checkin_set.all()), reverse=True)[:10]
#     # 10 units with most subscribers
#     units_top_subscribers = sorted(units, key=lambda x: len(x.subscribers.all()), reverse=True)[:10]
#     # 10 units with most checkins in the last month
#     units_top_checkins_last_month = sorted(
#         units,
#         key=lambda x: len(x.checkin_set.filter(date_created__gte=timezone.now() - timezone.timedelta(days=30))),
#         reverse=True,
#     )[:10]
#     # 10 units with the longest duistance traveled based on checkin location
#     units_top_distance = sorted(
#         units,
#         key=lambda x: sum([x.location.distance(y.location) for y in x.checkin_set.all() if y.location]),
#         reverse=True,
#     )[:10]

#     context = {
#         "units_top_checkins": units_top_checkins,
#         "units_top_subscribers": units_top_subscribers,
#         "units_top_checkins_last_month": units_top_checkins_last_month,
#         "units_top_distance": units_top_distance,
#     }
#     return render(request, "backend/leaderboards.html", context=context)
