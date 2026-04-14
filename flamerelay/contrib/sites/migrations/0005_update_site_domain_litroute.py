from django.conf import settings
from django.db import migrations


def update_site_forward(apps, schema_editor):
    Site = apps.get_model("sites", "Site")
    Site.objects.filter(id=settings.SITE_ID).update(domain="litroute.com", name="LitRoute")


def update_site_backward(apps, schema_editor):
    Site = apps.get_model("sites", "Site")
    Site.objects.filter(id=settings.SITE_ID).update(domain="flamerelay.org", name="FlameRelay")


class Migration(migrations.Migration):

    dependencies = [("sites", "0004_alter_options_ordering_domain")]

    operations = [migrations.RunPython(update_site_forward, update_site_backward)]
