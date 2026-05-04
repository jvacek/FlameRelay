from django.contrib.gis.geos import Point
from django.db import migrations


def forwards(apps, schema_editor):
    CheckIn = apps.get_model("backend", "CheckIn")
    for checkin in CheckIn.objects.exclude(location="").iterator():
        try:
            lat_str, lng_str = checkin.location.split(",", 1)
            checkin.location_point = Point(float(lng_str), float(lat_str), srid=4326)
            checkin.save(update_fields=["location_point"])
        except ValueError, AttributeError:
            pass


class Migration(migrations.Migration):
    dependencies = [
        ("backend", "0018_checkin_add_location_point"),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
