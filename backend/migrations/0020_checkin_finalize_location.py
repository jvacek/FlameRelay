import django.contrib.gis.db.models.fields
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("backend", "0019_checkin_migrate_location_data"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="checkin",
            name="location",
        ),
        migrations.RenameField(
            model_name="checkin",
            old_name="location_point",
            new_name="location",
        ),
        migrations.AlterField(
            model_name="checkin",
            name="location",
            field=django.contrib.gis.db.models.fields.PointField(geography=True, srid=4326),
        ),
    ]
