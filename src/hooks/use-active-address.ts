"use client";

import { useAccount } from "wagmi";
import { useAddressStore } from "@/stores/address-store";
import type { Address } from "viem";

export function useActiveAddress(): {
  address: Address | null;
  source: "connected" | "watch" | null;
} {
  const { address: connected } = useAccount();
  const watchAddress = useAddressStore((s) => s.watchAddress);

  // Explicit watch wins so demo / paste testing works even while a wallet is connected.
  if (watchAddress) {
    return { address: watchAddress, source: "watch" };
  }
  if (connected) {
    return { address: connected, source: "connected" };
  }
  return { address: null, source: null };
}
