"use client";

import type { Wallet, WalletDetailsParams } from "@rainbow-me/rainbowkit";
import { createConnector } from "wagmi";
import { injected } from "wagmi/connectors";

type EthereumProvider = {
  isMetaMask?: boolean;
  providers?: EthereumProvider[];
  request?: (...args: unknown[]) => Promise<unknown>;
};

function getMetaMaskProvider(): EthereumProvider | undefined {
  if (typeof window === "undefined") return undefined;
  const ethereum = (window as Window & { ethereum?: EthereumProvider }).ethereum;
  if (!ethereum) return undefined;
  if (Array.isArray(ethereum.providers) && ethereum.providers.length > 0) {
    return ethereum.providers.find(
      (candidate: EthereumProvider) => candidate.isMetaMask,
    );
  }
  return ethereum.isMetaMask ? ethereum : undefined;
}

/**
 * MetaMask via the browser injected provider (EIP-1193).
 * Avoids RainbowKit's metaMaskWallet → MetaMask SDK path, which crashes
 * MetaMask UI with: Cannot read properties of undefined (reading 'origin').
 */
export function metaMaskInjectedWallet(): Wallet {
  return {
    id: "metaMask",
    name: "MetaMask",
    rdns: "io.metamask",
    iconUrl: async () =>
      "https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/SVG_MetaMask_Icon_Color.svg",
    iconBackground: "#ffffff",
    installed:
      typeof window === "undefined" ? true : Boolean(getMetaMaskProvider()),
    downloadUrls: {
      chrome:
        "https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn",
      browserExtension: "https://metamask.io/download/",
    },
    createConnector: (walletDetails: WalletDetailsParams) =>
      createConnector((config) => ({
        ...injected({
          target: () => ({
            id: "metaMask",
            name: "MetaMask",
            provider: getMetaMaskProvider() as never,
          }),
        })(config),
        ...walletDetails,
      })),
  };
}
