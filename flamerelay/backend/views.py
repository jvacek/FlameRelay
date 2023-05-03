from django.shortcuts import render  # get_object_or_404

# from .services import create_map
# from .models import Unit


# View for the unit page
def unit_view(request, identifier):
    # unit = get_object_or_404(Unit, identifier=identifier)
    # map_html = create_map(unit.checkin_set.order('date_created'))
    return render(request, "backend/unit.html")  # , {'unit': unit, 'map_html': map_html})
