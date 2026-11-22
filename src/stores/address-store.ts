"use client";

import { create } from "zustand";
import type { Address } from "viem";

type AddressStore = {
  watchAddress: Address | null;
  setWatchAddress: (address: Address | null) => void;
};

export const useAddressStore = create<AddressStore>((set) => ({
  watchAddress: null,
  setWatchAddress: (address) => set({ watchAddress: address }),
}));
