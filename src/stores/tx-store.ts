"use client";

import { create } from "zustand";
import {
  INITIAL_TX_STATE,
  transition,
  type TxLifecycleState,
  type TxStatus,
} from "@/lib/tx/lifecycle";

type TxStore = TxLifecycleState & {
  setStatus: (
    status: TxStatus,
    patch?: Partial<Omit<TxLifecycleState, "status">>,
  ) => void;
  fail: (error: string, patch?: Partial<Omit<TxLifecycleState, "status">>) => void;
  reset: () => void;
};

export const useTxStore = create<TxStore>((set, get) => ({
  ...INITIAL_TX_STATE,
  setStatus: (status, patch = {}) => {
    const next = transition(get(), status, patch);
    set(next);
  },
  fail: (error, patch = {}) => {
    const current = get().status;
    if (current === "idle" || current === "confirmed" || current === "replaced") {
      set(
        transition(
          transition({ ...INITIAL_TX_STATE }, "simulating", patch),
          "failed",
          { ...patch, error },
        ),
      );
      return;
    }
    set(transition(get(), "failed", { ...patch, error }));
  },
  reset: () => set({ ...INITIAL_TX_STATE }),
}));
