import type { Page } from "@playwright/test";
import mockEvalBody from "./_mock-eval-body.json";

/** Pause before “Evaluate with AI” so headed runs show the click (local only by default). */
export function visibleStepPauseMs(): number {
  if (process.env.CI) return 0;
  if (process.env.E2E_HEADLESS === "1") return 0;
  const raw = process.env.E2E_STEP_PAUSE_MS;
  if (raw === "0") return 0;
  if (raw !== undefined && raw !== "") {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 1000;
  }
  return 1000;
}

/**
 * Scrolls the yellow Evaluate control into view, waits, then clicks — easier to see in Chromium.
 * Set `E2E_PAUSE_BEFORE_EVAL=1` to open Playwright’s inspector pause right before the click.
 */
export async function clickEvaluateWithAi(page: Page) {
  const btn = page.getByTestId("evaluate-ai-button");
  await btn.scrollIntoViewIfNeeded();
  if (process.env.E2E_PAUSE_BEFORE_EVAL === "1") {
    await page.pause();
  }
  const ms = visibleStepPauseMs();
  if (ms > 0) {
    await btn.hover();
    await new Promise((r) => setTimeout(r, ms));
  }
  await btn.click();
}

/** Default: mock AI so E2E does not need PLATFORM_API_KEY. Set E2E_MOCK_EVALUATE=0 for real API. */
export async function installEvaluateMock(page: Page) {
  if (process.env.E2E_MOCK_EVALUATE === "0") return;
  await page.route("**/api/evaluate", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockEvalBody),
    });
  });
}

export async function fillMonacoEditor(page: Page, text: string) {
  const editor = page.locator('[data-testid="monaco-code-editor"] .monaco-editor');
  await editor.waitFor({ state: "visible", timeout: 60_000 });
  await editor.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.type(text, { delay: 2 });
}
