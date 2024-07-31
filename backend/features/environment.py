from behave_django.testcase import BehaviorDrivenTestCase
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager

def before_all(context):
    # Set up Selenium WebDriver
    service = ChromeService(ChromeDriverManager().install())
    context.driver = webdriver.Chrome(service=service)
    context.driver.implicitly_wait(10)  # Wait up to 10 seconds for elements to appear

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

def after_scenario(context, scenario):
    # Tear down BehaviorDrivenTestCase
    context.test.tearDown()

print("environment.py loaded successfully")