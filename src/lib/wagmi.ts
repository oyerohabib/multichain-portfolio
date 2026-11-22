"use client";

import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import {
  base,
  baseSepolia,
  mainnet,
  optimism,
  optimismSepolia,
  sepolia,
} from "wagmi/chains";
import { APP_CHAINS } from "@/lib/chains";
import { metaMaskInjectedWallet } from "@/lib/metaMaskInjectedWallet";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "00000000000000000000000000000000";

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

function alchemyHttp(subdomain: string) {
  if (!alchemyKey) return http();
  return http(`https://${subdomain}.g.alchemy.com/v2/${alchemyKey}`);
}

const walletConnectParameters = {
  metadata: {
    name: "Multichain Portfolio",
    description: "Watch or connect a wallet across ETH, Base, and Optimism",
    url: appUrl,
    icons: [`${appUrl}/favicon.ico`],
  },
};

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        // Factory wrappers: RainbowKit calls each with { projectId, ... }
        () => metaMaskInjectedWallet(),
        injectedWallet,
        rainbowWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: "Multichain Portfolio",
    projectId,
    appUrl,
    walletConnectParameters,
  },
);

const transports = Object.fromEntries(
  APP_CHAINS.map((c) => [c.chain.id, alchemyHttp(c.rpcSubdomain)]),
) as Record<number, ReturnType<typeof http>>;

export const wagmiConfig = createConfig({
  connectors,
  chains: [mainnet, base, optimism, sepolia, baseSepolia, optimismSepolia],
  ssr: true,
  transports,
});
