from django.shortcuts import get_object_or_404, render

from .models import Unit


# View for the unit page
def unit_view(request, identifier):
    unit = get_object_or_404(Unit, identifier=identifier)
    map_html = unit.get_map()._repr_html_()
    return render(request, "backend/unit.html", {"unit": unit, "map_html": map_html})
