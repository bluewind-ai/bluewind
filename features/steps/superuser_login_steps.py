from behave import given, when, then
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.test import Client
from selenium.webdriver.common.by import By
from workspaces.models import Workspace, WorkspaceUser
import time
import logging
from django.utils import timezone


logger = logging.getLogger(__name__)

@given('I am a superuser')
def given_i_am_a_superuser(context):
    User = get_user_model()
    username = 'admin'
    email = 'admin@example.com'
    password = 'adminpassword'
    
    # Create superuser if it doesn't exist
    if not User.objects.filter(username=username).exists():
        user = User.objects.create_superuser(username=username, email=email, password=password)
    else:
        user = User.objects.get(username=username)
    
    # Create a workspace if it doesn't exist
    workspace, created = Workspace.objects.get_or_create(
        display_id='default-workspace',
        defaults={
            'name': 'Default Workspace',
            'created_at': timezone.now()
        }
    )
    
    # Assign the user to the workspace
    WorkspaceUser.objects.get_or_create(
        user=user,
        workspace=workspace,
        defaults={'is_default': True}
    )
    
    context.username = username
    context.password = password

@when('I log in with my credentials')
def step_impl(context):
    try:
        context.driver.get(context.test.live_server_url + reverse('login'))
        logger.info(f"Navigated to login page: {context.driver.current_url}")
        time.sleep(2)  # Add a small delay to ensure the page is loaded

        username_input = context.driver.find_element(By.NAME, 'username')
        password_input = context.driver.find_element(By.NAME, 'password')
        submit_button = context.driver.find_element(By.CSS_SELECTOR, 'input[type="submit"]')

        username_input.send_keys('admin')
        password_input.send_keys('adminpassword')
        submit_button.click()
        logger.info("Submitted login form")

        # Wait for redirection
        time.sleep(2)
        logger.info(f"Current URL after login: {context.driver.current_url}")

    except Exception as e:
        logger.error(f"Error during login process: {str(e)}")
        logger.error(f"Page source: {context.driver.page_source}")
        raise

@then('I should be redirected to my workspace')
def step_impl(context):
    expected_url = f"{context.test.live_server_url}/admin/{context.default_workspace.display_id}/"
    actual_url = context.driver.current_url
    print(f"Expected URL: {expected_url}")
    print(f"Actual URL: {actual_url}")
    assert actual_url.startswith(expected_url), f"Expected URL to start with: {expected_url}, Actual URL: {actual_url}"