from django.test import TestCase
from django.urls import reverse

class HealthCheckTestCase(TestCase):
    def test_health_check(self):
        url = reverse('health_check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content.decode(), "OK")