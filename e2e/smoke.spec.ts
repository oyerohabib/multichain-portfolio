import { expect, test } from "@playwright/test";
import { mockPortfolioApis, VITALIK } from "./fixtures";

test.describe("portfolio shell", () => {
  test("renders landing empty state and connect affordance", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: /Balances, activity, and send/i,
      }),
    ).toBeVisible();

    await expect(
      page.getByText(/Start with a wallet or a watch address/i),
    ).toBeVisible();

    await expect(page.getByTestId("network-mode-mainnet")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByTestId("watch-demo-vitalik")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Connect Wallet/i }),
    ).toBeVisible();
  });
});

test.describe("watch address", () => {
  test.beforeEach(async ({ page }) => {
    await mockPortfolioApis(page);
  });

  test("loads Vitalik demo and shows portfolio panels", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("watch-demo-vitalik").click();

    await expect(page.getByTestId("watching-address")).toContainText(/0xd8/i);
    await expect(page.getByTestId("watch-demo-vitalik")).toBeDisabled();
    await expect(page.getByTestId("watch-demo-vitalik")).toContainText(
      /Watching Vitalik/i,
    );

    await expect(page.getByTestId("net-worth")).toContainText("$671,266");
    await expect(page.getByText(/Watch-only · ETH, Base, Optimism/i)).toBeVisible();
    await expect(page.getByTestId("token-table")).toBeVisible();
    await expect(page.getByTestId("token-table")).toContainText("ETH");
    await expect(page.getByTestId("activity-feed")).toBeVisible();
    await expect(page.getByTestId("activity-feed")).toContainText(/Received/i);
  });

  test("accepts a pasted watch address", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("watch-address-input").fill(VITALIK);
    await page.getByTestId("watch-address-submit").click();

    await expect(page.getByTestId("watching-address")).toBeVisible();
    await expect(page.getByTestId("net-worth")).toBeVisible();
    await expect(page.getByTestId("token-table")).toContainText("2 assets");
  });

  test("rejects an invalid watch address", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("watch-address-input").fill("not-an-address");
    await page.getByTestId("watch-address-submit").click();

    await expect(page.getByText(/Enter a valid 0x address/i)).toBeVisible();
    await expect(page.getByTestId("watching-address")).toHaveCount(0);
    await expect(
      page.getByText(/Start with a wallet or a watch address/i),
    ).toBeVisible();
  });

  test("clears watch mode back to empty state", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("watch-demo-vitalik").click();
    await expect(page.getByTestId("watching-address")).toBeVisible();

    await page.getByTestId("watch-address-clear").click();

    await expect(page.getByTestId("watching-address")).toHaveCount(0);
    await expect(
      page.getByText(/Start with a wallet or a watch address/i),
    ).toBeVisible();
    await expect(page.getByTestId("watch-demo-vitalik")).toBeEnabled();
  });
});

test.describe("network mode", () => {
  test("toggles to testnet labels and demo hint", async ({ page }) => {
    await mockPortfolioApis(page);
    await page.goto("/");

    await page.getByTestId("watch-demo-vitalik").click();
    await expect(page.getByTestId("net-worth")).toContainText("$671,266");

    await page.getByTestId("network-mode-testnet").click();
    await expect(page.getByTestId("network-mode-testnet")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await expect(
      page.getByText(/Watch-only · Sepolia, Base Sepolia, OP Sepolia/i),
    ).toBeVisible();
    await expect(page.getByTestId("demo-testnet-hint")).toBeVisible();
    await expect(page.getByTestId("net-worth")).toContainText("$0.00");
  });

  test("shows loading banner while mode switch fetch is in flight", async ({
    page,
  }) => {
    await mockPortfolioApis(page, { portfolioDelayMs: 800 });
    await page.goto("/");

    await page.getByTestId("watch-demo-vitalik").click();
    await expect(page.getByTestId("net-worth")).toContainText("$671,266");

    await page.getByTestId("network-mode-testnet").click();

    await expect(page.getByTestId("portfolio-loading")).toBeVisible();
    await expect(page.getByTestId("network-mode-testnet")).toBeDisabled();

    await expect(page.getByTestId("portfolio-loading")).toHaveCount(0, {
      timeout: 10_000,
    });
    await expect(page.getByTestId("demo-testnet-hint")).toBeVisible();
  });

  test("toggles back to mainnet", async ({ page }) => {
    await mockPortfolioApis(page);
    await page.goto("/");

    await page.getByTestId("watch-demo-vitalik").click();
    await page.getByTestId("network-mode-testnet").click();
    await expect(page.getByTestId("demo-testnet-hint")).toBeVisible();

    await page.getByTestId("network-mode-mainnet").click();
    await expect(page.getByTestId("network-mode-mainnet")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByTestId("demo-testnet-hint")).toHaveCount(0);
    await expect(page.getByText(/Watch-only · ETH, Base, Optimism/i)).toBeVisible();
  });
});

test.describe("errors", () => {
  test("surfaces portfolio API failures", async ({ page }) => {
    await mockPortfolioApis(page, { portfolioStatus: 502 });
    await page.goto("/");

    await page.getByTestId("watch-demo-vitalik").click();

    await expect(page.getByText(/Mock portfolio failure/i)).toBeVisible();
  });
});
