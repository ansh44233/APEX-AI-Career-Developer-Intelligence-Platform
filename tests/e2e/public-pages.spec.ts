import { expect, test } from "@playwright/test";

test("landing page renders the APEX introduction", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: /Turn preparation into your next advantage/i })).toBeVisible();
});

test("sign-in page renders the authentication form", async ({ page }) => {
  const response = await page.goto("/sign-in");
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
});

test("sign-up page renders the account creation form", async ({ page }) => {
  const response = await page.goto("/sign-up");
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: /Create your account/i })).toBeVisible();
});

test("Company Intelligence renders its company-to-role workspace", async ({ page }) => {
  const response = await page.goto("/features/company-intelligence");
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: /Know the company/i })).toBeVisible();
  await expect(page.getByText("Explore companies", { exact: true })).toBeVisible();
});

test("Question Bank renders its practice library", async ({ page }) => {
  const response = await page.goto("/features/question-bank");
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: "Interview Question Bank" })).toBeVisible();
});

test("Interview Experiences loads the moderated public library", async ({ page }) => {
  const apiResponse = page.waitForResponse(response =>
    response.url().includes("/api/interview-experiences") && response.request().method() === "GET"
  );
  const response = await page.goto("/features/interview-experiences");
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: /Interview experiences/i })).toBeVisible();
  expect((await apiResponse).status()).toBe(200);
});
