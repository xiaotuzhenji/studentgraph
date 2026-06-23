import { expect, test } from "@playwright/test";

test("user creates a source, opens its node, adds a note, and marks it learned", async ({ page }) => {
  const email = `flow-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password-123456");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByRole("button", { name: "New learning content" }).click();
  await page.getByLabel("Question").check();
  await page.getByLabel("Title").fill("What is a database index?");
  await page.getByLabel("Description").fill("Explain indexes for a beginner.");
  await page.getByRole("button", { name: "Create card" }).click();

  await page.getByText("What is a database index?").click();
  await expect(page).toHaveURL(/\/nodes\//);

  await page.getByRole("button", { name: "Add note branch" }).click();
  await page.getByLabel("Note title").fill("Index intuition");
  await page.getByLabel("Note content").fill("Indexes trade write cost for faster reads.");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByRole("link", { name: "Index intuition" })).toBeVisible();

  await page.getByRole("button", { name: "Mark learned" }).click();
  await expect(page.getByRole("button", { name: "Learned", exact: true })).toBeVisible();
  await page.goto("/knowledge");
  await expect(page.getByText("What is a database index?")).toBeVisible();
});
