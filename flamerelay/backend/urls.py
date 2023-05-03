from django.urls import path

from flamerelay.backend.views import unit_view

app_name = "backend"
urlpatterns = [
    path("unit/<str:identifier>/", view=unit_view, name="unit"),
]
