import { expect, test } from "@playwright/test";

test("user can register and reach the canvas", async ({ page }) => {
  const email = `learner-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password-123456");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/canvas$/);
  await expect(page.getByText("Learning Canvas")).toBeVisible();
});
