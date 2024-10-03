import { test, expect, chromium } from "@playwright/test";
import dotenv from "dotenv";

test("Admin login and logout", async ({ page }) => {
  dotenv.config();
  page.goto(
    `${process.env.SITE_URL}:${process.env.SITE_PORT}/login/?next=/login`
  );
  page.getByLabel("Username:").fill(`${process.env.DJANGO_SUPERUSER_EMAIL}`);
  page.getByLabel("Password:").fill(`${process.env.DJANGO_SUPERUSER_PASSWORD}`);
  page.getByRole("button", { name: "Log in" }).click();

  page.getByRole("button", { name: "Log out" }).click();
  page.getByRole("link", { name: "Log in again" }).click();
});
