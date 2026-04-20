from django.urls import path

from .views import user_profile_view, user_settings_view, user_update_view

app_name = "users"
urlpatterns = [
    path("", view=user_profile_view, name="profile"),
    path("settings/", view=user_settings_view, name="settings"),
    path("update/", view=user_update_view, name="update"),
]
