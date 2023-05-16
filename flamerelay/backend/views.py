from captcha.fields import CaptchaField
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.forms import ModelForm
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse

from .models import CheckIn, Unit


# View for the unit page
def unit_view(request, identifier):
    unit = get_object_or_404(Unit, identifier=identifier)

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


# A view for the CheckIn object creation using a form
@login_required
def checkin_create_view(request, identifier):
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
                # "name_of_place",
                "location",
            ]

    form = CheckInForm(request.POST or None, initial={"unit": identifier})
    if form.is_valid():
        form.unit = Unit.objects.filter(identifier=identifier)
        form.created_by = request.user
        form.cleaned_data.pop("captcha")
        CheckIn.objects.create(
            created_by=request.user,
            unit=Unit.objects.get(identifier=identifier),
            **form.cleaned_data,
        )
        messages.success(request, "Checkin saved correctly.")
        return redirect(reverse("backend:unit", kwargs={"identifier": identifier}))

    context = {"form": form}
    return render(request, "backend/checkin_create.html", context)


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
#     # 10 units with the longest duistance travelled based on checkin location
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
