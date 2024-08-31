import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto(`${process.env.SITE_URL}:${process.env.SITE_PORT}`);
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
    .getByLabel(
      "Select this object for an action - test fetching emails from gmail"
    )
    .check();
  await page
    .getByLabel("Action: --------- Delete")
    .selectOption("clone_workspace_action");
  // await page
  //   .getByText(
  //     "Action: --------- Delete selected workspaces Clone selected workspace Go 1 of 7"
  //   )
  //   .click();
  await page.getByRole("button", { name: "Go" }).click();
  await page.getByRole("link", { name: /\/wks_[a-f0-9]+\/admin\// }).click();
  await page
    .getByRole("rowheader", { name: "Channels" })
    .getByRole("link")
    .click();
  await page.getByLabel("Select this object for an").check();
  await page
    .getByLabel("Action: --------- Delete")
    .selectOption("fetch_messages_from_gmail");
  await page.getByRole("button", { name: "Go" }).click();
  await page.getByRole("link", { name: "Messages", exact: true }).click();
  await page.getByLabel("Select all objects on this").check();
  await page
    .getByLabel("Action: --------- Delete")
    .selectOption("delete_selected");
  await page.getByRole("button", { name: "Go" }).click();
  await page.getByRole("button", { name: "Yes, I’m sure" }).click();
  await page.getByText("Successfully deleted 10").click();
  await page
    .getByRole("rowheader", { name: "Workspaces" })
    .getByRole("link")
    .click();
  await page.getByRole("link", { name: "Delete Current Workspace" }).click();
  await page.getByRole("button", { name: "Yes, I’m sure" }).click();
});
