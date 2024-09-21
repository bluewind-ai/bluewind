import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  page.goto(`${process.env.SITE_URL}:${process.env.SITE_PORT}`);
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
    .getByLabel(
      "Select this object for an action - test fetching emails from gmail"
    )
    .check();
  page
    .getByLabel("Action: --------- Delete")
    .selectOption("clone_workspace_action");
  // page
  //   .getByText(
  //     "Action: --------- Delete selected workspaces Clone selected workspace Go 1 of 7"
  //   )
  //   .click();
  page.getByRole("button", { name: "Go" }).click();
  page.getByRole("link", { name: /\/workspaces/[a-f0-9]+\/admin\// }).click();
  page
    .getByRole("rowheader", { name: "Channels" })
    .getByRole("link")
    .click();
  page.getByLabel("Select this object for an").check();
  page
    .getByLabel("Action: --------- Delete")
    .selectOption("fetch_messages_from_gmail");
  page.getByRole("button", { name: "Go" }).click();
  page.getByRole("link", { name: "Messages", exact: true }).click();
  page.getByLabel("Select all objects on this").check();
  page
    .getByLabel("Action: --------- Delete")
    .selectOption("delete_selected");
  page.getByRole("button", { name: "Go" }).click();
  page.getByRole("button", { name: "Yes, I’m sure" }).click();
  page.getByText("Successfully deleted 10").click();
  page
    .getByRole("rowheader", { name: "Workspaces" })
    .getByRole("link")
    .click();
  page.getByRole("link", { name: "Delete Current Workspace" }).click();
  page.getByRole("button", { name: "Yes, I’m sure" }).click();
});
