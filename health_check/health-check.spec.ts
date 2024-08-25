import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto(`${process.env.SITE_URL}:${process.env.SITE_PORT}/health/`);
  await page.getByText("OK").click();
});
