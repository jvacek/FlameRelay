# Generated by Django 4.1.9 on 2023-05-22 10:35

from django.db import migrations
import django_resized.forms
import flamerelay.backend.models


class Migration(migrations.Migration):
    dependencies = [
        ("backend", "0006_alter_checkin_options_alter_unit_identifier"),
    ]

    operations = [
        migrations.AlterField(
            model_name="checkin",
            name="image",
            field=django_resized.forms.ResizedImageField(
                blank=True,
                crop=None,
                force_format="JPEG",
                keep_meta=False,
                null=True,
                quality=-1,
                scale=None,
                size=[1024, 1024],
                upload_to=flamerelay.backend.models.path_and_rename,
            ),
        ),
    ]
