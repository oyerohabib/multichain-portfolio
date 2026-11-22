import type { Page, Route } from "@playwright/test";

export const VITALIK = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

export function mockPortfolio(
  mode: "mainnet" | "testnet",
  overrides: Record<string, unknown> = {},
) {
  const isTestnet = mode === "testnet";
  return {
    address: VITALIK,
    mode,
    totalValueUsd: isTestnet ? 0 : 671_266.42,
    change24hUsd: null,
    change24hPercent: null,
    truncated: false,
    partialErrors: [],
    tokens: isTestnet
      ? [
          {
            network: "eth-sepolia",
            chainId: 11155111,
            contractAddress: null,
            symbol: "ETH",
            name: "Ether",
            logo: null,
            decimals: 18,
            balance: "0.05",
            priceUsd: null,
            change24h: null,
            valueUsd: null,
          },
        ]
      : [
          {
            network: "eth-mainnet",
            chainId: 1,
            contractAddress: null,
            symbol: "ETH",
            name: "Ether",
            logo: null,
            decimals: 18,
            balance: "248.12",
            priceUsd: 2500,
            change24h: null,
            valueUsd: 620_300,
          },
          {
            network: "base-mainnet",
            chainId: 8453,
            contractAddress: null,
            symbol: "ETH",
            name: "Ether",
            logo: null,
            decimals: 18,
            balance: "12.4",
            priceUsd: 2500,
            change24h: null,
            valueUsd: 31_000,
          },
        ],
    ...overrides,
  };
}

export function mockActivity(
  mode: "mainnet" | "testnet",
  overrides: Record<string, unknown> = {},
) {
  const network = mode === "testnet" ? "eth-sepolia" : "eth-mainnet";
  const chainId = mode === "testnet" ? 11155111 : 1;
  return {
    address: VITALIK,
    mode,
    partialErrors: [],
    items: [
      {
        network,
        chainId,
        hash: "0xabc123def4567890abc123def4567890abc123def4567890abc123def4567890",
        category: "external",
        direction: "in",
        from: "0x1111111111111111111111111111111111111111",
        to: VITALIK,
        asset: "ETH",
        value: "1.5",
        valueUsd: null,
        timestamp: new Date().toISOString(),
        explorerUrl: `https://etherscan.io/tx/0xabc`,
      },
    ],
    ...overrides,
  };
}

type MockOptions = {
  /** Delay portfolio responses (ms) to assert loading UI. */
  portfolioDelayMs?: number;
  portfolioStatus?: number;
  activityStatus?: number;
};

/**
 * Intercept portfolio/activity APIs so e2e stays fast and deterministic.
 */
export async function mockPortfolioApis(page: Page, options: MockOptions = {}) {
  const {
    portfolioDelayMs = 0,
    portfolioStatus = 200,
    activityStatus = 200,
  } = options;

  await page.route("**/api/portfolio", async (route: Route) => {
    const post = route.request().postDataJSON() as {
      mode?: "mainnet" | "testnet";
    };
    const mode = post?.mode === "testnet" ? "testnet" : "mainnet";

    if (portfolioDelayMs > 0) {
      await new Promise((r) => setTimeout(r, portfolioDelayMs));
    }

    if (portfolioStatus >= 400) {
      await route.fulfill({
        status: portfolioStatus,
        contentType: "application/json",
        body: JSON.stringify({ error: "Mock portfolio failure" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockPortfolio(mode)),
    });
  });

  await page.route("**/api/activity", async (route: Route) => {
    const post = route.request().postDataJSON() as {
      mode?: "mainnet" | "testnet";
    };
    const mode = post?.mode === "testnet" ? "testnet" : "mainnet";

    if (activityStatus >= 400) {
      await route.fulfill({
        status: activityStatus,
        contentType: "application/json",
        body: JSON.stringify({ error: "Mock activity failure" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockActivity(mode)),
    });
  });
}
