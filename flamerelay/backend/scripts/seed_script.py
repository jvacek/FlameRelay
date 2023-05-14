from flamerelay.backend.factories import CheckInFactory, UnitFactory
from flamerelay.backend.models import Unit
from flamerelay.users.models import User

# Create a bunch of units


def run():
    if not User.objects.exists():
        user = User.objects.create_user(email="test@abc.com", password="test")
    elif User.objects.filter(is_superuser=True).exists():
        user = User.objects.filter(is_superuser=True).first()
    else:
        user = User.objects.first()
    print(user)

    if Unit.objects.filter(identifier="test-123").exists():
        unit = Unit.objects.first()
        unit.checkin_set.all().delete()
        unit.delete()

    unit = UnitFactory(identifier="test-123", created_by=user)

    for i in range(10):
        print(i)
        unit = UnitFactory(created_by=user)

    for unit in Unit.objects.all():
        e = CheckInFactory(unit=unit, created_by=user)
        print(e)
