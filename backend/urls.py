from django.urls import path

from backend.views import checkin_create_view, checkin_edit_view, unit_view

app_name = "backend"
urlpatterns = [
    path("unit/<str:identifier>/", view=unit_view, name="unit"),
    path("unit/<str:identifier>/checkin", view=checkin_create_view, name="checkin"),
    path("unit/<str:identifier>/checkin/<int:checkin_id>", view=checkin_edit_view, name="checkin_edit"),
]
