from datetime import timedelta

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone

from config.constants import CHECKIN_EDIT_GRACE_PERIOD_HOURS

from .models import CheckIn, Unit


def homepage_view(request):
    return render(request, "pages/home.html")


def unit_view(request, identifier):
    unit = get_object_or_404(Unit, identifier=identifier)
    return render(request, "backend/unit.html", {"unit": unit})


@login_required
def checkin_create_view(request, identifier):
    unit = get_object_or_404(Unit, identifier=identifier)
    if unit.admin_only_checkin and not (request.user.is_superuser or request.user.is_staff):
        messages.warning(request, "This specific unit can only be checked in by admins.")
        return redirect(reverse("backend:unit", kwargs={"identifier": identifier}))
    return render(request, "backend/checkin_edit.html", {"unit": unit, "mode": "create"})


@login_required
def checkin_edit_view(request, identifier, checkin_id):
    checkin = get_object_or_404(CheckIn, id=checkin_id)
    unit = get_object_or_404(Unit, identifier=identifier)

    if checkin.created_by != request.user:
        messages.warning(request, "You can only edit your own checkins.")
        return redirect(reverse("backend:unit", kwargs={"identifier": identifier}))

    if checkin.date_created < timezone.now() - timedelta(hours=CHECKIN_EDIT_GRACE_PERIOD_HOURS):
        messages.warning(request, f"You cannot edit checkins after {CHECKIN_EDIT_GRACE_PERIOD_HOURS} hours.")
        return redirect(reverse("backend:unit", kwargs={"identifier": identifier}))

    return render(request, "backend/checkin_edit.html", {"unit": unit, "checkin": checkin, "mode": "edit"})
