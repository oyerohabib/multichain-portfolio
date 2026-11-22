"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PortfolioResponse } from "@/lib/alchemy";
import type { NetworkMode } from "@/lib/chains";
import { useNetworkModeStore } from "@/stores/network-mode-store";

async function fetchPortfolioClient(
  address: string,
  mode: NetworkMode,
): Promise<PortfolioResponse> {
  const res = await fetch("/api/portfolio", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ address, mode }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? "Failed to load portfolio");
  }
  return json as PortfolioResponse;
}

export function usePortfolio(address: string | null) {
  const mode = useNetworkModeStore((s) => s.mode);

  return useQuery({
    queryKey: ["portfolio", address, mode],
    queryFn: () => fetchPortfolioClient(address!, mode),
    enabled: Boolean(address),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    // Keep the previous mode's UI mounted while the next mode loads.
    placeholderData: keepPreviousData,
  });
}
