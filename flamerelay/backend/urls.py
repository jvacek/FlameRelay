from django.urls import path

from flamerelay.backend.views import checkin_create_view, unit_view

app_name = "backend"
urlpatterns = [
    path("unit/<str:identifier>/", view=unit_view, name="unit"),
    path("unit/<str:identifier>/checkin", view=checkin_create_view, name="checkin"),
]
