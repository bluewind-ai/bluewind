# features/superuser_login.feature

Feature: Superuser Login
  As a superuser
  I want to log in to the system
  So that I can access my workspace

  Scenario: Superuser logs in and is redirected to workspace
    Given I am a superuser
    When I log in with my credentials
    Then I should be redirected to my workspace