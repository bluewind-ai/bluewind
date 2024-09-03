import { test, expect } from "@playwright/test";
test("test", async ({ page }) => {
  await page.goto(
    `${process.env.SITE_URL}:${process.env.SITE_PORT}/admin/login/?next=/admin/login`
  );
  await page.getByLabel("Username:").click();
  await page
    .getByLabel("Username:")
    .fill(`${process.env.DJANGO_SUPERUSER_EMAIL}`);
  await page.getByLabel("Password:").click();
  await page
    .getByLabel("Password:")
    .fill(`${process.env.DJANGO_SUPERUSER_PASSWORD}`);
  await page.getByRole("button", { name: "Log in" }).click();
  await page
    .getByRole("rowheader", { name: "Workspaces" })
    .getByRole("link")
    .click();
  await page
    .getByLabel("Select this object for an action - test clone workspace")
    .check();
  await page
    .getByLabel("Action: --------- Delete")
    .selectOption("clone_workspace_action");
  await page.getByRole("button", { name: "Go" }).click();
  await page.getByRole("link", { name: /\/workspaces/[a-f0-9]+\/admin\// }).click();
  await page.getByRole("link", { name: "Persons" }).click();
  await page.getByRole("link", { name: "To Clone" }).click();
  await page
    .getByRole("rowheader", { name: "Workspaces" })
    .getByRole("link")
    .click();
  await page.getByRole("link", { name: "Delete Current Workspace" }).click();
  await page.getByRole("button", { name: "Yes, I’m sure" }).click();
});
