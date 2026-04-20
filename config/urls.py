from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.views import defaults as default_views
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.authtoken.views import obtain_auth_token

from flamerelay.users.views import spa_view

urlpatterns = [
    # Django Admin
    path(settings.ADMIN_URL, admin.site.urls),
    # Allauth headless API (magic code, MFA, social OAuth flows)
    path("_allauth/", include("allauth.headless.urls")),
    # Named SPA entries for auth pages — names preserved so allauth can reverse them
    path("accounts/login/", spa_view, name="account_login"),
    path("accounts/signup/", spa_view, name="account_signup"),
    path("accounts/confirm-email/<str:key>/", spa_view, name="account_confirm_email"),
    # Allauth full URL patterns (OAuth callbacks live here)
    path("accounts/", include("allauth.urls")),
    # Media files
    *static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT),
]

# API URLS
urlpatterns += [
    path("api/", include("config.api_router")),
    path("api/auth-token/", obtain_auth_token, name="obtain_auth_token"),
    path("api/schema/", SpectacularAPIView.as_view(), name="api-schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="api-schema"),
        name="api-docs",
    ),
]

urlpatterns += [
    path("captcha/", include("captcha.urls")),
]

if settings.DEBUG:
    urlpatterns += [
        path(
            "400/",
            default_views.bad_request,
            kwargs={"exception": Exception("Bad Request!")},
        ),
        path(
            "403/",
            default_views.permission_denied,
            kwargs={"exception": Exception("Permission Denied")},
        ),
        path(
            "404/",
            default_views.page_not_found,
            kwargs={"exception": Exception("Page not Found")},
        ),
        path("500/", default_views.server_error),
    ]
    if "debug_toolbar" in settings.INSTALLED_APPS:
        import debug_toolbar

        urlpatterns = [path("__debug__/", include(debug_toolbar.urls)), *urlpatterns]

# SPA catch-all — must be last; serves the React shell for all remaining routes
urlpatterns += [
    re_path(r"^.*$", spa_view, name="spa"),
]
