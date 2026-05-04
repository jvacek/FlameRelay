import django.contrib.gis.db.models.fields
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("backend", "0017_remove_checkin_image"),
    ]

    operations = [
        migrations.AddField(
            model_name="checkin",
            name="location_point",
            field=django.contrib.gis.db.models.fields.PointField(geography=True, null=True, srid=4326),
        ),
    ]
