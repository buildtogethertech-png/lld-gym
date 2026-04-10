import { test, expect } from "@playwright/test";
import { installEvaluateMock, fillMonacoEditor, clickEvaluateWithAi } from "./helpers";
import { fetchMePlanLimits, resolveFreeEvalUiClickCount } from "./plan-limits";

const FREE_PROBLEM = "oop-encapsulation-car";
test.describe("Free user — register → problem → evaluate → UML saved", () => {
  test("full journey", async ({ page }) => {
    const umlTitle = `E2E UML Free ${Date.now()}`;
    const email = `e2e-free-${Date.now()}@lld-hub.test`;
    const password = "E2eRegister_Free99!";

    await installEvaluateMock(page);

    await page.goto("/register");
    await page.getByTestId("register-name").fill("E2E Free Register");
    await page.getByTestId("register-email").fill(email);
    await page.getByTestId("register-password").fill(password);
    await page.getByTestId("register-submit").click();

    await expect(page.getByRole("heading", { name: /LLD Hub/i })).toBeVisible({ timeout: 60_000 });

    const limits = await fetchMePlanLimits(page.request);
    expect(limits.planSlug).toBe("free");
    const evalClicks = resolveFreeEvalUiClickCount(limits);

    await page.goto(`/problem/${FREE_PROBLEM}`);
    await expect(page.getByText("This problem is locked")).toHaveCount(0);
    await fillMonacoEditor(
      page,
      "// E2E: minimal design for Car, Engine, Wheel\nclass Car {}\nclass Engine {}\nclass Wheel {}\n"
    );

    for (let i = 0; i < evalClicks; i++) {
      await clickEvaluateWithAi(page);
      // Evaluate switches to Submissions tab; panel lives on Description tab
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

    await expect(page.getByTestId("uml-save-button")).toBeEnabled();
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/diagrams") && r.request().method() === "POST" && r.ok()
      ),
      page.getByTestId("uml-save-button").click(),
    ]);
    await expect(page.getByText("Saved ✓")).toBeVisible({ timeout: 15_000 });

    await page.goto("/uml-practice/my-diagrams");
    await expect(page.getByTestId("my-diagrams-heading")).toBeVisible();
    await expect(page.getByText(umlTitle, { exact: true })).toBeVisible();
    await expect(page.getByText(new RegExp(`\\d+\\/${limits.umlDiagrams} diagrams`))).toBeVisible();
  });
});
