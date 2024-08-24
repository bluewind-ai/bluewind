import { test, expect, chromium } from "@playwright/test";
import dotenv from "dotenv";

test("Admin login and logout", async ({ page }) => {
  dotenv.config();
  const baseUrl = process.env.BASE_URL;
  await page.goto(`${baseUrl}/admin/login/?next=/admin/login`);
  await page
    .getByLabel("Username:")
    .fill(`${process.env.DJANGO_SUPERUSER_EMAIL}`);
  await page
    .getByLabel("Password:")
    .fill(`${process.env.DJANGO_SUPERUSER_PASSWORD}`);
  page.getByRole("button", { name: "Log in" }).click(),
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  await page.getByRole("button", { name: "Log out" }).click();
  await page.getByRole("link", { name: "Log in again" }).click();
});
