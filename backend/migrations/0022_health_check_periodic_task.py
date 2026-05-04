from django.db import migrations


def create_health_check_task(apps, schema_editor):
    IntervalSchedule = apps.get_model("django_celery_beat", "IntervalSchedule")
    PeriodicTask = apps.get_model("django_celery_beat", "PeriodicTask")

    schedule, _ = IntervalSchedule.objects.get_or_create(
        every=5,
        period="minutes",
    )
    PeriodicTask.objects.get_or_create(
        name="health-check",
        defaults={
            "task": "backend.tasks.health_check",
            "interval": schedule,
        },
    )


def remove_health_check_task(apps, schema_editor):
    PeriodicTask = apps.get_model("django_celery_beat", "PeriodicTask")
    PeriodicTask.objects.filter(name="health-check").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("backend", "0021_alter_checkin_message"),
        ("django_celery_beat", "0019_alter_periodictasks_options"),
    ]

    operations = [
        migrations.RunPython(create_health_check_task, remove_health_check_task),
    ]
