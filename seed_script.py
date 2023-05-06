from flamerelay.backend.factories import CheckInFactory, UnitFactory
from flamerelay.users.models import User

# Create a bunch of units


if not User.objects.exists():
    user = User.objects.create_user(email="test@abc.com", password="test")
elif User.objects.filter(is_superuser=True).exists():
    user = User.objects.filter(is_superuser=True).first()
else:
    user = User.objects.first()


for i in range(10):
    if i == 0:
        unit = UnitFactory(identifier="test-123", created_by=user)
    else:
        unit = UnitFactory(created_by=user)

    # Create a bunch of checkins for each unit
    for _ in range(10):
        e = CheckInFactory(unit=unit, created_by=user)
