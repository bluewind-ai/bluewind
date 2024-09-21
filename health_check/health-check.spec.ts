import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  page.goto(`${process.env.SITE_URL}:${process.env.SITE_PORT}/health/`);
  page.getByText("OK").click();
});
