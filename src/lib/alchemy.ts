import {
  getAlchemyNetworksForMode,
  getAppChainByNetwork,
  explorerTxForNetwork,
  networkToChainId,
  type AlchemyNetwork,
  type NetworkMode,
} from "@/lib/chains";

const DATA_BASE = "https://api.g.alchemy.com/data/v1";

export type PortfolioToken = {
  network: AlchemyNetwork;
  chainId: number;
  contractAddress: string | null;
  symbol: string;
  name: string;
  logo: string | null;
  decimals: number;
  balance: string;
  priceUsd: number | null;
  change24h: number | null;
  valueUsd: number | null;
};

export type PortfolioResponse = {
  address: string;
  mode: NetworkMode;
  totalValueUsd: number;
  change24hUsd: number | null;
  change24hPercent: number | null;
  tokens: PortfolioToken[];
  /** True when Alchemy returned more pages than we fetched (speed cap). */
  truncated: boolean;
  partialErrors: string[];
};

export type ActivityItem = {
  network: AlchemyNetwork;
  chainId: number;
  hash: string;
  category: string;
  direction: "in" | "out" | "self" | "unknown";
  from: string;
  to: string;
  asset: string;
  value: string | null;
  valueUsd: number | null;
  timestamp: string;
  explorerUrl: string;
};

export type ActivityResponse = {
  address: string;
  mode: NetworkMode;
  items: ActivityItem[];
  partialErrors: string[];
};

type AlchemyToken = {
  network?: string;
  tokenAddress?: string | null;
  tokenBalance?: string;
  tokenMetadata?: {
    decimals?: number | null;
    logo?: string | null;
    name?: string | null;
    symbol?: string | null;
  };
  tokenPrices?: Array<{
    currency?: string;
    value?: string | number;
    lastUpdatedAt?: string;
  }>;
};

type AlchemyTransfer = {
  network?: string;
  hash?: string;
  category?: string;
  blockTimestamp?: string;
  from?: string;
  to?: string;
  asset?: string;
  value?: number | string | null;
  contractAddress?: string | null;
  fungible?: {
    rawValue?: string;
    value?: number | string | null;
    decimals?: number;
    asset?: string;
  };
  rawContract?: {
    address?: string | null;
    decimal?: string | null;
  };
  metadata?: {
    blockTimestamp?: string;
  };
};

type RpcAssetTransfer = {
  hash?: string;
  category?: string;
  from?: string;
  to?: string | null;
  value?: number | null;
  asset?: string | null;
  metadata?: { blockTimestamp?: string };
};

function getApiKey(): string {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) {
    throw new Error("Missing ALCHEMY_API_KEY");
  }
  return key;
}

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatUnits(atomic: string, decimals: number): string {
  let bi: bigint;
  try {
    bi = BigInt(atomic);
  } catch {
    return "0";
  }
  const d = Math.max(0, Math.min(36, decimals));
  const base = BigInt(10) ** BigInt(d);
  const whole = bi / base;
  const frac = bi % base;
  if (frac === BigInt(0)) return whole.toString();

  const fracStr = frac.toString().padStart(d, "0").replace(/0+$/, "");
  return `${whole}.${fracStr}`;
}

function pickUsdPrice(
  prices: AlchemyToken["tokenPrices"],
): number | null {
  if (!prices?.length) return null;
  const usd = prices.find(
    (p) => (p.currency ?? "").toLowerCase() === "usd",
  );
  const raw = usd?.value ?? prices[0]?.value;
  if (raw == null) return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

function directionFor(
  address: string,
  from: string,
  to: string,
): ActivityItem["direction"] {
  const lower = address.toLowerCase();
  if (from.toLowerCase() === lower && to.toLowerCase() === lower) return "self";
  if (from.toLowerCase() === lower) return "out";
  if (to.toLowerCase() === lower) return "in";
  return "unknown";
}

function mapTransfer(
  address: string,
  t: AlchemyTransfer,
  fallbackNetwork: AlchemyNetwork,
): ActivityItem | null {
  if (!t.hash) return null;
  const network = (t.network ?? fallbackNetwork) as AlchemyNetwork;
  const from = t.from ?? "";
  const to = t.to ?? "";
  const rawValue = t.fungible?.value ?? t.value;
  const value =
    rawValue == null
      ? null
      : typeof rawValue === "number"
        ? String(rawValue)
        : rawValue;

  return {
    network,
    chainId: networkToChainId(network),
    hash: t.hash,
    category: t.category ?? "unknown",
    direction: directionFor(address, from, to),
    from,
    to,
    asset: t.fungible?.asset ?? t.asset ?? "ETH",
    value,
    valueUsd: null,
    timestamp:
      t.blockTimestamp ??
      t.metadata?.blockTimestamp ??
      new Date().toISOString(),
    explorerUrl: explorerTxForNetwork(network, t.hash),
  };
}

async function alchemyPost<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const apiKey = getApiKey();
  const res = await fetch(`${DATA_BASE}/${apiKey}/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Alchemy error ${res.status}: ${detail.slice(0, 300)}`);
  }

  return res.json() as Promise<T>;
}

async function alchemyRpc<T>(
  rpcSubdomain: string,
  method: string,
  params: unknown[],
): Promise<T> {
  const apiKey = getApiKey();
  const res = await fetch(
    `https://${rpcSubdomain}.g.alchemy.com/v2/${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method,
        params,
      }),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Alchemy RPC ${res.status}: ${detail.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    result?: T;
    error?: { message?: string };
  };
  if (json.error) {
    throw new Error(json.error.message ?? "Alchemy RPC error");
  }
  return json.result as T;
}

/**
 * One page per network (in parallel). Full pagination for spam-heavy wallets
 * was ~1 minute of sequential Alchemy calls.
 */
const MAX_PAGES_PER_NETWORK = 1;

type PortfolioCacheEntry = {
  expiresAt: number;
  value: PortfolioResponse;
};

const PORTFOLIO_CACHE_TTL_MS = 60_000;
const portfolioCache = new Map<string, PortfolioCacheEntry>();

type TokensPage = {
  data?: { tokens?: AlchemyToken[]; pageKey?: string };
  error?: { partialErrors?: Array<{ network?: string; message?: string }> };
};

export async function fetchPortfolioCached(
  address: string,
  mode: NetworkMode = "mainnet",
): Promise<PortfolioResponse> {
  const key = `${mode}:${address.toLowerCase()}`;
  const hit = portfolioCache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value;
  }

  const value = await fetchPortfolio(address, mode);
  portfolioCache.set(key, {
    expiresAt: Date.now() + PORTFOLIO_CACHE_TTL_MS,
    value,
  });
  return value;
}

async function fetchTokensForNetwork(
  address: string,
  network: AlchemyNetwork,
): Promise<{
  tokens: AlchemyToken[];
  truncated: boolean;
  partialErrors: string[];
}> {
  const tokens: AlchemyToken[] = [];
  const partialErrors: string[] = [];
  let pageKey: string | undefined;
  let pages = 0;
  let truncated = false;

  do {
    const body: Record<string, unknown> = {
      addresses: [{ address, networks: [network] }],
      withMetadata: true,
      withPrices: true,
      includeNativeTokens: true,
      includeErc20Tokens: true,
    };
    if (pageKey) body.pageKey = pageKey;

    const json = await alchemyPost<TokensPage>(
      "assets/tokens/by-address",
      body,
    );

    tokens.push(...(json.data?.tokens ?? []));
    for (const err of json.error?.partialErrors ?? []) {
      partialErrors.push(
        `${err.network ?? network}: ${err.message ?? "partial failure"}`,
      );
    }
    pageKey = json.data?.pageKey;
    pages += 1;

    if (pageKey && pages >= MAX_PAGES_PER_NETWORK) {
      truncated = true;
      break;
    }
  } while (pageKey);

  return { tokens, truncated, partialErrors };
}

export async function fetchPortfolio(
  address: string,
  mode: NetworkMode = "mainnet",
): Promise<PortfolioResponse> {
  const networks = getAlchemyNetworksForMode(mode);

  const settled = await Promise.all(
    networks.map((network) => fetchTokensForNetwork(address, network)),
  );

  const tokens: AlchemyToken[] = [];
  const partialErrors: string[] = [];
  let truncated = false;

  for (const result of settled) {
    tokens.push(...result.tokens);
    partialErrors.push(...result.partialErrors);
    truncated = truncated || result.truncated;
  }

  const mapped: PortfolioToken[] = tokens
    .map((t) => {
      const network = (t.network ?? networks[0]) as AlchemyNetwork;
      const meta = t.tokenMetadata ?? {};
      const decimals =
        typeof meta.decimals === "number" && meta.decimals != null
          ? meta.decimals
          : 18;
      const balance = formatUnits(String(t.tokenBalance ?? "0"), decimals);
      const priceUsd = pickUsdPrice(t.tokenPrices);
      const balanceNum = toNumber(balance);
      const valueUsd =
        priceUsd != null ? balanceNum * priceUsd : null;

      return {
        network,
        chainId: networkToChainId(network),
        contractAddress: t.tokenAddress ?? null,
        symbol: meta.symbol ?? (t.tokenAddress ? "TOKEN" : "ETH"),
        name: meta.name ?? meta.symbol ?? "Unknown",
        logo: meta.logo ?? null,
        decimals,
        balance,
        priceUsd,
        change24h: null,
        valueUsd,
      };
    })
    .filter((t) => toNumber(t.balance) > 0)
    .sort((a, b) => {
      const valueDiff = (b.valueUsd ?? 0) - (a.valueUsd ?? 0);
      if (valueDiff !== 0) return valueDiff;
      // Prefer priced / native assets when USD is tied at $0 (testnet / dust).
      const aRank = (a.valueUsd != null ? 2 : 0) + (a.contractAddress ? 0 : 1);
      const bRank = (b.valueUsd != null ? 2 : 0) + (b.contractAddress ? 0 : 1);
      return bRank - aRank;
    });

  const totalValueUsd = mapped.reduce(
    (sum, t) => sum + (t.valueUsd ?? 0),
    0,
  );

  return {
    address,
    mode,
    totalValueUsd,
    change24hUsd: null,
    change24hPercent: null,
    tokens: mapped,
    truncated,
    partialErrors,
  };
}

async function fetchMainnetActivity(
  address: string,
  networks: AlchemyNetwork[],
): Promise<{ items: ActivityItem[]; partialErrors: string[] }> {
  type TransfersPage = {
    transfers?: AlchemyTransfer[];
    pageKey?: string | null;
    error?: { partialErrors?: Array<{ network?: string; message?: string }> };
  };

  const transfers: AlchemyTransfer[] = [];
  const partialErrors: string[] = [];
  let pageKey: string | undefined;
  let pages = 0;

  do {
    const body: Record<string, unknown> = {
      address,
      direction: "both",
      networks,
      category: ["external", "erc20", "internal"],
      order: "desc",
      maxCount: 50,
    };
    if (pageKey) body.pageKey = pageKey;

    const json = await alchemyPost<TransfersPage>(
      "transfers/by-address",
      body,
    );

    transfers.push(...(json.transfers ?? []));
    for (const err of json.error?.partialErrors ?? []) {
      partialErrors.push(
        `${err.network ?? "unknown"}: ${err.message ?? "partial failure"}`,
      );
    }
    pageKey = json.pageKey ?? undefined;
    pages += 1;
  } while (pageKey && pages < 2);

  const items = transfers
    .map((t) => mapTransfer(address, t, networks[0]))
    .filter((item): item is ActivityItem => Boolean(item))
    .slice(0, 40);

  return { items, partialErrors };
}

async function fetchTestnetActivity(
  address: string,
  networks: AlchemyNetwork[],
): Promise<{ items: ActivityItem[]; partialErrors: string[] }> {
  const partialErrors: string[] = [];
  const items: ActivityItem[] = [];

  await Promise.all(
    networks.map(async (network) => {
      const appChain = getAppChainByNetwork(network);
      if (!appChain) return;

      try {
        const result = await alchemyRpc<{ transfers?: RpcAssetTransfer[] }>(
          appChain.rpcSubdomain,
          "alchemy_getAssetTransfers",
          [
            {
              fromBlock: "0x0",
              toBlock: "latest",
              fromAddress: address,
              category: ["external", "erc20", "internal"],
              order: "desc",
              withMetadata: true,
              excludeZeroValue: true,
              maxCount: "0x19",
            },
          ],
        );

        const fromTransfers = result?.transfers ?? [];

        const received = await alchemyRpc<{ transfers?: RpcAssetTransfer[] }>(
          appChain.rpcSubdomain,
          "alchemy_getAssetTransfers",
          [
            {
              fromBlock: "0x0",
              toBlock: "latest",
              toAddress: address,
              category: ["external", "erc20", "internal"],
              order: "desc",
              withMetadata: true,
              excludeZeroValue: true,
              maxCount: "0x19",
            },
          ],
        );

        const merged = [...fromTransfers, ...(received?.transfers ?? [])];
        const seen = new Set<string>();

        for (const t of merged) {
          if (!t.hash || seen.has(`${t.hash}-${t.category}-${t.from}-${t.to}`)) {
            continue;
          }
          seen.add(`${t.hash}-${t.category}-${t.from}-${t.to}`);
          const from = t.from ?? "";
          const to = t.to ?? "";
          items.push({
            network,
            chainId: networkToChainId(network),
            hash: t.hash,
            category: t.category ?? "unknown",
            direction: directionFor(address, from, to),
            from,
            to,
            asset: t.asset ?? "ETH",
            value: t.value == null ? null : String(t.value),
            valueUsd: null,
            timestamp:
              t.metadata?.blockTimestamp ?? new Date().toISOString(),
            explorerUrl: explorerTxForNetwork(network, t.hash),
          });
        }
      } catch (err) {
        partialErrors.push(
          `${network}: ${err instanceof Error ? err.message : "RPC failure"}`,
        );
      }
    }),
  );

  items.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return { items: items.slice(0, 40), partialErrors };
}

export async function fetchActivity(
  address: string,
  mode: NetworkMode = "mainnet",
): Promise<ActivityResponse> {
  const networks = getAlchemyNetworksForMode(mode);
  const result =
    mode === "testnet"
      ? await fetchTestnetActivity(address, networks)
      : await fetchMainnetActivity(address, networks);

  return {
    address,
    mode,
    items: result.items,
    partialErrors: result.partialErrors,
  };
}
