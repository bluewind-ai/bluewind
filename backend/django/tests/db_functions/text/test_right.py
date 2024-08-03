from django.db import connection
from django.db.models import IntegerField, Value
from django.db.models.functions import Length, Lower, Right
from django.test import TestCase

from ..models import Author


class RightTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        Author.objects.create(name="John Smith", alias="smithj")
        Author.objects.create(name="Rhonda")

    def test_basic(self):
        authors = Author.objects.annotate(name_part=Right("name", 5))
        self.assertQuerySetEqual(
            authors.order_by("name"), ["Smith", "honda"], lambda a: a.name_part
        )
        # If alias is null, set it to the first 2 lower characters of the name.
        Author.objects.filter(alias__isnull=True).update(alias=Lower(Right("name", 2)))
        self.assertQuerySetEqual(
            authors.order_by("name"), ["smithj", "da"], lambda a: a.alias
        )

    def test_invalid_length(self):
        with self.assertRaisesMessage(ValueError, "'length' must be greater than 0"):
            Author.objects.annotate(raises=Right("name", 0))

    def test_zero_length(self):
        Author.objects.create(name="Tom", alias="tom")
        authors = Author.objects.annotate(
            name_part=Right("name", Length("name") - Length("alias"))
        )
        self.assertQuerySetEqual(
            authors.order_by("name"),
            [
                "mith",
                "" if connection.features.interprets_empty_strings_as_nulls else None,
                "",
            ],
            lambda a: a.name_part,
        )

    def test_expressions(self):
        authors = Author.objects.annotate(
            name_part=Right("name", Value(3, output_field=IntegerField()))
        )
        self.assertQuerySetEqual(
            authors.order_by("name"), ["ith", "nda"], lambda a: a.name_part
        )
