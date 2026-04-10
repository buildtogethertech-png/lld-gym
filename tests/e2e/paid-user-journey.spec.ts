import { test, expect } from "@playwright/test";
import { installEvaluateMock, fillMonacoEditor, clickEvaluateWithAi } from "./helpers";
import { fetchMePlanLimits, resolvePaidEvalUiClickCount } from "./plan-limits";

const PAID_EMAIL = process.env.E2E_PAID_EMAIL ?? "e2e-paid@lld-hub.test";
const PAID_PASSWORD = process.env.E2E_PAID_PASSWORD ?? "E2eHub_Test_2026!";
const LOCKED_PROBLEM = "food-delivery";
test.describe("Paid user — login → locked problem → evaluate → UML saved", () => {
  test("full journey (run npm run e2e:seed first)", async ({ page }) => {
    const umlTitle = `E2E UML Paid ${Date.now()}`;
    await installEvaluateMock(page);

    await page.goto("/login");
    await page.getByTestId("login-email").fill(PAID_EMAIL);
    await page.getByTestId("login-password").fill(PAID_PASSWORD);
    await page.getByTestId("login-submit").click();

    await expect(page.getByRole("heading", { name: /LLD Hub/i })).toBeVisible({ timeout: 60_000 });

    const limits = await fetchMePlanLimits(page.request);
    expect(limits.planSlug).not.toBe("free");
    const evalClicks = resolvePaidEvalUiClickCount();

    await page.goto(`/problem/${LOCKED_PROBLEM}`);
    await expect(page.getByText("This problem is locked")).toHaveCount(0);

    await fillMonacoEditor(
      page,
      "// E2E paid: food delivery sketch\nclass Order {}\nclass Restaurant {}\nclass Customer {}\n"
    );

    for (let i = 0; i < evalClicks; i++) {
      await clickEvaluateWithAi(page);
      await page.getByRole("button", { name: "Description" }).click();
      await expect(page.getByTestId("eval-result-total")).toHaveText("88", { timeout: 60_000 });
    }

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/user/me") && r.request().method() === "GET" && r.ok(),
        { timeout: 30_000 }
      ),
      page.goto("/uml-practice/new"),
    ]);
    await expect(page.locator(".react-flow")).toBeVisible({ timeout: 30_000 });

    await page.getByTestId("uml-title-display").click();
    await page.getByTestId("uml-title-input").fill(umlTitle);
    await page.keyboard.press("Enter");

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/diagrams") && r.request().method() === "POST" && r.ok()
      ),
      page.getByTestId("uml-save-button").click(),
    ]);
    await expect(page.getByText("Saved ✓")).toBeVisible({ timeout: 15_000 });

    await page.goto("/uml-practice/my-diagrams");
    await expect(page.getByText(umlTitle, { exact: true })).toBeVisible();
    await expect(page.getByText(new RegExp(`\\d+\\/${limits.umlDiagrams} diagrams`))).toBeVisible();
  });
});
