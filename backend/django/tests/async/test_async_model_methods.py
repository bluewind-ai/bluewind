from django.test import TestCase

from .models import SimpleModel


class AsyncModelOperationTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.s1 = SimpleModel.objects.create(field=0)

    async def test_asave(self):
        self.s1.field = 10
        await self.s1.asave()
        refetched = await SimpleModel.objects.aget()
        self.assertEqual(refetched.field, 10)

    async def test_adelete(self):
        await self.s1.adelete()
        count = await SimpleModel.objects.acount()
        self.assertEqual(count, 0)

    async def test_arefresh_from_db(self):
        await SimpleModel.objects.filter(pk=self.s1.pk).aupdate(field=20)
        await self.s1.arefresh_from_db()
        self.assertEqual(self.s1.field, 20)
