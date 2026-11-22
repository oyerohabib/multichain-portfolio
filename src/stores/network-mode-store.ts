"use client";

import { create } from "zustand";
import type { NetworkMode } from "@/lib/chains";

type NetworkModeStore = {
  mode: NetworkMode;
  setMode: (mode: NetworkMode) => void;
};

export const useNetworkModeStore = create<NetworkModeStore>((set) => ({
  mode: "mainnet",
  setMode: (mode) => set({ mode }),
}));
