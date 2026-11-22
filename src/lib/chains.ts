import {
  base,
  baseSepolia,
  mainnet,
  optimism,
  optimismSepolia,
  sepolia,
  type Chain,
} from "viem/chains";

export type NetworkMode = "mainnet" | "testnet";

export type AlchemyNetwork =
  | "eth-mainnet"
  | "base-mainnet"
  | "opt-mainnet"
  | "eth-sepolia"
  | "base-sepolia"
  | "opt-sepolia";

export type AppChain = {
  chain: Chain;
  alchemyNetwork: AlchemyNetwork;
  rpcSubdomain: string;
  shortName: string;
  accent: string;
  mode: NetworkMode;
};

export const MAINNET_CHAINS: AppChain[] = [
  {
    chain: mainnet,
    alchemyNetwork: "eth-mainnet",
    rpcSubdomain: "eth-mainnet",
    shortName: "ETH",
    accent: "#627EEA",
    mode: "mainnet",
  },
  {
    chain: base,
    alchemyNetwork: "base-mainnet",
    rpcSubdomain: "base-mainnet",
    shortName: "Base",
    accent: "#0052FF",
    mode: "mainnet",
  },
  {
    chain: optimism,
    alchemyNetwork: "opt-mainnet",
    rpcSubdomain: "opt-mainnet",
    shortName: "OP",
    accent: "#FF0420",
    mode: "mainnet",
  },
];

export const TESTNET_CHAINS: AppChain[] = [
  {
    chain: sepolia,
    alchemyNetwork: "eth-sepolia",
    rpcSubdomain: "eth-sepolia",
    shortName: "Sepolia",
    accent: "#627EEA",
    mode: "testnet",
  },
  {
    chain: baseSepolia,
    alchemyNetwork: "base-sepolia",
    rpcSubdomain: "base-sepolia",
    shortName: "Base Sepolia",
    accent: "#0052FF",
    mode: "testnet",
  },
  {
    chain: optimismSepolia,
    alchemyNetwork: "opt-sepolia",
    rpcSubdomain: "opt-sepolia",
    shortName: "OP Sepolia",
    accent: "#FF0420",
    mode: "testnet",
  },
];

export const APP_CHAINS: AppChain[] = [...MAINNET_CHAINS, ...TESTNET_CHAINS];

export const SUPPORTED_CHAINS = APP_CHAINS.map((c) => c.chain);

/** @deprecated Prefer getAlchemyNetworksForMode */
export const ALCHEMY_NETWORKS: AlchemyNetwork[] = MAINNET_CHAINS.map(
  (c) => c.alchemyNetwork,
);

export function getChainsForMode(mode: NetworkMode): AppChain[] {
  return mode === "testnet" ? TESTNET_CHAINS : MAINNET_CHAINS;
}

export function getAlchemyNetworksForMode(mode: NetworkMode): AlchemyNetwork[] {
  return getChainsForMode(mode).map((c) => c.alchemyNetwork);
}

export function getAppChainById(chainId: number): AppChain | undefined {
  return APP_CHAINS.find((c) => c.chain.id === chainId);
}

export function getAppChainByNetwork(
  network: string,
): AppChain | undefined {
  return APP_CHAINS.find((c) => c.alchemyNetwork === network);
}

export function isNetworkMode(value: unknown): value is NetworkMode {
  return value === "mainnet" || value === "testnet";
}

export function explorerTxUrl(chainId: number, hash: string): string {
  const appChain = getAppChainById(chainId);
  const baseUrl = appChain?.chain.blockExplorers?.default.url;
  return baseUrl ? `${baseUrl}/tx/${hash}` : `https://etherscan.io/tx/${hash}`;
}

export function networkToChainId(network: string): number {
  switch (network) {
    case "eth-mainnet":
      return mainnet.id;
    case "base-mainnet":
      return base.id;
    case "opt-mainnet":
      return optimism.id;
    case "eth-sepolia":
      return sepolia.id;
    case "base-sepolia":
      return baseSepolia.id;
    case "opt-sepolia":
      return optimismSepolia.id;
    default:
      return mainnet.id;
  }
}

export function explorerTxForNetwork(network: string, hash: string): string {
  switch (network) {
    case "base-mainnet":
      return `https://basescan.org/tx/${hash}`;
    case "opt-mainnet":
      return `https://optimistic.etherscan.io/tx/${hash}`;
    case "eth-sepolia":
      return `https://sepolia.etherscan.io/tx/${hash}`;
    case "base-sepolia":
      return `https://sepolia.basescan.org/tx/${hash}`;
    case "opt-sepolia":
      return `https://sepolia-optimism.etherscan.io/tx/${hash}`;
    default:
      return `https://etherscan.io/tx/${hash}`;
  }
}
