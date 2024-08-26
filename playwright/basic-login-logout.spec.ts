import { test, expect, chromium } from "@playwright/test";
import dotenv from "dotenv";

test("Admin login and logout", async ({ page }) => {
  dotenv.config();
  await page.goto(
    `${process.env.SITE_URL}:${process.env.SITE_PORT}/admin/login/?next=/admin/login`
  );
  await page
    .getByLabel("Username:")
    .fill(`${process.env.DJANGO_SUPERUSER_EMAIL}`);
  await page
    .getByLabel("Password:")
    .fill(`${process.env.DJANGO_SUPERUSER_PASSWORD}`);
  page.getByRole("button", { name: "Log in" }).click();

  await page.getByRole("button", { name: "Log out" }).click();
  await page.getByRole("link", { name: "Log in again" }).click();
});