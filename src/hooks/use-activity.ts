"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ActivityResponse } from "@/lib/alchemy";
import type { NetworkMode } from "@/lib/chains";
import { useNetworkModeStore } from "@/stores/network-mode-store";

async function fetchActivityClient(
  address: string,
  mode: NetworkMode,
): Promise<ActivityResponse> {
  const res = await fetch("/api/activity", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ address, mode }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? "Failed to load activity");
  }
  return json as ActivityResponse;
}

export function useActivity(address: string | null) {
  const mode = useNetworkModeStore((s) => s.mode);

  return useQuery({
    queryKey: ["activity", address, mode],
    queryFn: () => fetchActivityClient(address!, mode),
    enabled: Boolean(address),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}
