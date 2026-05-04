from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0002_backfill_user_name"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="language",
            field=models.CharField(default="en", max_length=10),
        ),
    ]
