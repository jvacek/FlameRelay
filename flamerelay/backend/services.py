import folium

from flamerelay.backend.models import Unit


def create_map(unit: Unit) -> folium.Map:
    checkins = unit.checkin_set.order_by("date_created")
    location_strings: list[str] = checkins.values_list("location", flat=True)
    points = [tuple(map(float, j.split(","))) for j in location_strings]

    m = folium.Map()
    # add markers
    for point in points:
        folium.Marker(point).add_to(m)

    # add the lines
    if checkins.count() > 1:
        folium.PolyLine(points, weight=5, opacity=1).add_to(m)

    # Use the max() and min() functions with the negation of the key functions to
    # find the most south-western and most north-eastern coordinates
    sw = min(points, key=lambda p: (lambda p: p[0], -(lambda p: p[1])))
    ne = max(points, key=lambda p: (lambda p: p[0], -(lambda p: p[1])))

    m.fit_bounds([sw, ne])
    return m


# m = create_map(response)
