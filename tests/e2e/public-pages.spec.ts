import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const e2eEmail = `apex-e2e-${Date.now()}@example.test`;

test.afterAll(async () => {
  try {
    await prisma.user.deleteMany({ where: { email: e2eEmail } });
  } finally {
    await prisma.$disconnect();
  }
});

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

test("Company Intelligence carries the selected company and role into the Question Bank", async ({ page }) => {
  await page.goto("/features/company-intelligence");
  await page.getByLabel("Target role").selectOption("Frontend Engineer");
  await page.getByRole("link", { name: /Explore question bank/i }).click();
  await expect(page).toHaveURL(/company=Google/);
  await expect(page).toHaveURL(/role=Frontend(%20|\+)Engineer/);
  await expect(page.getByText("Google preparation context")).toBeVisible();
  await expect(page.getByLabel("TARGET ROLE")).toHaveValue("Frontend Engineer");
});

test("Question Bank search narrows the visible practice prompts", async ({ page }) => {
  await page.goto("/features/question-bank");
  const search = page.getByPlaceholder("Search questions, topics or skills...");
  await search.fill("Pair Sum");
  await expect(page.getByRole("button", { name: /Pair Sum/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Longest Substring Without Repeating Characters/i })).toHaveCount(0);
});


test("a new user can create an account and save a career goal", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("APEX E2E Test");
  await page.getByLabel("Email").fill(e2eEmail);
  await page.getByLabel("Password").fill("APEX-E2E-Only-Password-2026!");
  await page.getByRole("button", { name: /Create account/i }).click();

  await expect(page).toHaveURL(/\\/dashboard/);
  await expect(page.getByRole("heading", { name: "Build your next breakthrough." })).toBeVisible();

  const goalsResponse = page.waitForResponse(response =>
    response.url().includes("/api/career-goals") && response.request().method() === "GET"
  );
  await expect(page.getByRole("heading", { name: "Career goals" })).toBeVisible();
  expect((await goalsResponse).status()).toBe(200);

  await page.getByPlaceholder("Target role (e.g. Backend Engineer)").fill("E2E Test Engineer");
  await page.getByPlaceholder("Target company (optional)").fill("APEX Test Org");
  const createResponse = page.waitForResponse(response =>
    response.url().includes("/api/career-goals") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Add career goal" }).click();
  expect((await createResponse).status()).toBe(201);
  await expect(page.getByRole("heading", { name: "E2E Test Engineer" })).toBeVisible();
});
