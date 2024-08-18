import os
import logging
import subprocess
from urllib.parse import urljoin
from django.test import TestCase
from django.urls import reverse

class HealthCheckTestCase(TestCase):
    def setUp(self):
        self.url = reverse('health_check')
        self.test_host = os.environ.get('TEST_HOST', 'app-bluewind-alb-1840324227.us-west-2.elb.amazonaws.com')
        self.curl_path = "/usr/bin/curl"

    def test_health_check_with_custom_host(self):
        # Construct the full URL
        full_url = urljoin(f"http://{self.test_host}", self.url)
        
        # Construct the curl command as a list of arguments
        curl_command = [
            self.curl_path,
            "-X", "GET",
            "-H", f"Host: {self.test_host}",
            "-H", f"X-Forwarded-Host: {self.test_host}",
            "-H", "X-Forwarded-Proto: http",
            full_url
        ]
        
        print(f"Equivalent curl command:\n{' '.join(curl_command)}")

        # Log the curl command
        logging.info(f"Equivalent curl command:\n{' '.join(curl_command)}")

        # Run the curl command in a subprocess
        try:
            result = subprocess.run(curl_command, check=True, capture_output=True, text=True)
            print("Curl request output:")
            print(result.stdout)
            if result.stderr:
                print("Curl request error:")
                print(result.stderr)
        except subprocess.CalledProcessError as e:
            print(f"Curl request failed with exit code {e.returncode}")
            print("Error output:")
            print(e.stderr)

        # Perform the actual test with Django test client
        response = self.client.get(
            self.url,
            HTTP_HOST=self.test_host,
            HTTP_X_FORWARDED_HOST=self.test_host,
            HTTP_X_FORWARDED_PROTO='http'
        )
        
        # Original assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content.decode(), "OK")