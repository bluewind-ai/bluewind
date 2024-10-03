import { test, expect } from "@playwright/test";
test("test", async ({ page }) => {
  page.goto(
    `${process.env.SITE_URL}:${process.env.SITE_PORT}/login/?next=/login`
  );
  page.getByLabel("Username:").click();
  page
    .getByLabel("Username:")
    .fill(`${process.env.DJANGO_SUPERUSER_EMAIL}`);
  page.getByLabel("Password:").click();
  page
    .getByLabel("Password:")
    .fill(`${process.env.DJANGO_SUPERUSER_PASSWORD}`);
  page.getByRole("button", { name: "Log in" }).click();
  page
    .getByRole("rowheader", { name: "Workspaces" })
    .getByRole("link")
    .click();
  page
    .getByLabel("Select this object for an action - test clone workspace")
    .check();
  page
    .getByLabel("Action: --------- Delete")
    .selectOption("clone_workspace_action");
  page.getByRole("button", { name: "Go" }).click();
  page.getByRole("link", { name: /\/workspaces/[a-f0-9]+\/admin\// }).click();
  page.getByRole("link", { name: "Persons" }).click();
  page.getByRole("link", { name: "To Clone" }).click();
  page
    .getByRole("rowheader", { name: "Workspaces" })
    .getByRole("link")
    .click();
  page.getByRole("link", { name: "Delete Current Workspace" }).click();
  page.getByRole("button", { name: "Yes, I’m sure" }).click();
});
