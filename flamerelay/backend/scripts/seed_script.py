import factory
from django.db.models.signals import post_save

from flamerelay.backend.factories import CheckInFactory, UnitFactory
from flamerelay.backend.models import Unit
from flamerelay.users.models import User


# Create a bunch of units with checkins
@factory.django.mute_signals(post_save)
def run():
    if not User.objects.exists():
        user = User.objects.create_user(email="test@abc.com", password="test")
    elif User.objects.filter(is_superuser=True).exists():
        user = User.objects.filter(is_superuser=True).first()
    else:
        user = User.objects.first()
    print(user)

    if Unit.objects.filter(identifier="test-123").exists():
        unit = Unit.objects.get(identifier="test-123")
        unit.checkin_set.all().delete()
        unit.delete()

    unit = UnitFactory(identifier="test-123", created_by=user)

    n = 10
    for i in range(n):
        for _ in range(7):
            CheckInFactory(unit=unit, created_by=user)
        if i != n - 1:
            unit = UnitFactory(created_by=user)
