# features/steps/superuser_login_steps.py

from behave import given, when, then
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.test import Client
from selenium.webdriver.common.by import By

@given('I am a superuser')
def step_impl(context):
    User = get_user_model()
    context.user = User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='adminpassword'
    )
    context.client = Client()

@when('I log in with my credentials')
def step_impl(context):
    context.driver.get(context.test.live_server_url + reverse('login'))
    username_input = context.driver.find_element(By.NAME, 'username')
    password_input = context.driver.find_element(By.NAME, 'password')
    submit_button = context.driver.find_element(By.CSS_SELECTOR, 'input[type="submit"]')

    username_input.send_keys('admin')
    password_input.send_keys('adminpassword')
    submit_button.click()

@then('I should be redirected to my workspace')
def step_impl(context):
    assert context.driver.current_url.endswith('/workspace/')
