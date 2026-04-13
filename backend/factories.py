import factory
from django.utils import timezone
from factory import fuzzy

from .models import CheckIn, Unit


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "users.User"

    username = factory.Faker("user_name")
    email = factory.Faker("email")
    password = factory.Faker("password")


class UnitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Unit

    # string, a dash, and two digits
    identifier = factory.Sequence(
        lambda n: f"{fuzzy.FuzzyText(length=3).fuzz().lower()}-{n}{fuzzy.FuzzyInteger(0, 9).fuzz()}"
    )
    created_by = factory.SubFactory(UserFactory)
    date_created = factory.Faker("date_time_this_month", tzinfo=timezone.get_current_timezone())


class CheckInFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CheckIn

    unit = factory.SubFactory(UnitFactory)
    date_created = factory.Faker("date_time_this_month", tzinfo=timezone.get_current_timezone())
    created_by = factory.SubFactory(UserFactory)
    image = factory.Faker("image_url")
    message = factory.Faker("text")
    # name_of_place = factory.Faker("city")
    location = factory.LazyFunction(lambda: f"{fuzzy.FuzzyFloat(-90, 90).fuzz()},{fuzzy.FuzzyFloat(-180, 180).fuzz()}")
