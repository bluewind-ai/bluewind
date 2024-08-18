import os
import requests
from urllib.parse import urljoin
from django.test import TestCase
from django.urls import reverse

class HealthCheckTestCase(TestCase):
    def setUp(self):
        self.url_path = reverse('health_check')
        self.test_host = os.environ.get('TEST_HOST', 'app-bluewind-alb-1840324227.us-west-2.elb.amazonaws.com')
        self.full_url = urljoin(f"http://{self.test_host}", self.url_path)

    def test_health_check_with_requests(self):
        headers = {
            'Host': self.test_host,
            'X-Forwarded-Host': self.test_host,
            'X-Forwarded-Proto': 'http'
        }

        try:
            response = requests.get(self.full_url, headers=headers, timeout=2)
            
            print(f"Request URL: {self.full_url}")
            print(f"Response status code: {response.status_code}")
            print(f"Response content: {response.text}")

            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.text, "OK")
            
        except requests.Timeout:
            self.fail("Health check timed out after 2 seconds")
        except requests.RequestException as e:
            self.fail(f"Request failed: {str(e)}")