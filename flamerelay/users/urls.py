from django.urls import path

from .views import user_detail_view, user_redirect_view, user_settings_view, user_update_view

app_name = "users"
urlpatterns = [
    path("~redirect/", view=user_redirect_view, name="redirect"),
    path("~update/", view=user_update_view, name="update"),
    path("~settings/", view=user_settings_view, name="settings"),
    path("<str:username>/", view=user_detail_view, name="detail"),
]
