import { test, expect } from "@playwright/test";

/**
 * Exercises the real POST /api/evaluate handler (no route mock).
 * Ensures a valid session maps to a DB user before any submission upsert — avoids
 * PrismaClientKnownRequestError: Foreign key constraint violated on submissions_userId_fkey
 * when the JWT id has no matching users row.
 */
test.describe("POST /api/evaluate (real server)", () => {
  test("returns 401 when not logged in", async ({ request }) => {
    const res = await request.post("/api/evaluate", {
      data: {
        problemId: "oop-encapsulation-car",
        answer: "// not authenticated",
        language: "java",
        timeZone: "UTC",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("with new account: never returns 500 Prisma FK on submissions", async ({ page }) => {
    const email = `e2e-eval-api-${Date.now()}@lld-hub.test`;
    const password = "E2eEvalApi_Pass99!";

    await page.goto("/register");
    await page.getByTestId("register-email").fill(email);
    await page.getByTestId("register-password").fill(password);
    await page.getByTestId("register-submit").click();
    await expect(page.getByRole("heading", { name: /LLD Hub/i })).toBeVisible({ timeout: 60_000 });

    const res = await page.request.post("/api/evaluate", {
      data: {
        problemId: "oop-encapsulation-car",
        answer: "// E2E: submission FK smoke",
        language: "java",
        timeZone: "UTC",
      },
    });

    const status = res.status();
    const raw = await res.text();

    expect(raw.toLowerCase()).not.toContain("foreign key constraint");
    expect(raw.toLowerCase()).not.toContain("submissions_userid_fkey");

    // No platform/user API key → 422 before LLM. With keys → 200 or provider 502/429.
    expect([200, 422, 429, 502]).toContain(status);
  });
});
