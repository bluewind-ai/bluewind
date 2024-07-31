from behave_django.testcase import BehaviorDrivenTestCase
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from django.contrib.auth import get_user_model
from workspaces.models import WorkspaceUser  # Replace 'your_app' with the actual app name

def check_url_ends_with_default_workspace(context):
    if context.default_workspace_display_id:
        current_url = context.driver.current_url
        return current_url.endswith(f'/{context.default_workspace_display_id}')
    return False

def before_all(context):
    # Set up Selenium WebDriver
    service = ChromeService(ChromeDriverManager().install())
    context.driver = webdriver.Chrome(service=service)
    context.driver.implicitly_wait(10)  # Wait up to 10 seconds for elements to appear
    
    # Make the function available in the context
    context.check_url_ends_with_default_workspace = check_url_ends_with_default_workspace

def after_all(context):
    # Quit the Selenium WebDriver
    if hasattr(context, 'driver'):
        context.driver.quit()

def before_scenario(context, scenario):
    # Set up BehaviorDrivenTestCase
    context.test = BehaviorDrivenTestCase()
    context.test.setUp()
    
    # Clear cookies before each scenario
    if hasattr(context, 'driver'):
        context.driver.delete_all_cookies()
    
    # Get the default workspace for the user
    User = get_user_model()
    user = User.objects.first()  # Or use a specific user as needed
    default_workspace_user = WorkspaceUser.objects.filter(user=user, is_default=True).first()
    
    if default_workspace_user:
        context.default_workspace_display_id = default_workspace_user.workspace.display_id
    else:
        context.default_workspace_display_id = None

def after_scenario(context, scenario):
    # Tear down BehaviorDrivenTestCase
    context.test.tearDown()

print("environment.py loaded successfully")