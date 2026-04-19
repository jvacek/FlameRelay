from django.db import migrations, models


def backfill_names(apps, schema_editor):
    User = apps.get_model("users", "User")
    User.objects.filter(name="").update(name=models.F("username"))


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(backfill_names, migrations.RunPython.noop),
    ]
