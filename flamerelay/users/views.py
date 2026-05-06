from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import TemplateView

spa_view = ensure_csrf_cookie(TemplateView.as_view(template_name="spa.html"))
