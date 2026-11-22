export const TX_STATUSES = [
  "idle",
  "simulating",
  "awaiting_signature",
  "broadcasting",
  "pending",
  "confirmed",
  "failed",
  "replaced",
] as const;

export type TxStatus = (typeof TX_STATUSES)[number];

export type TxLifecycleState = {
  status: TxStatus;
  hash?: `0x${string}`;
  chainId?: number;
  description?: string;
  error?: string;
  replacedBy?: `0x${string}`;
};

export const INITIAL_TX_STATE: TxLifecycleState = {
  status: "idle",
};

const TERMINAL: ReadonlySet<TxStatus> = new Set([
  "idle",
  "confirmed",
  "failed",
  "replaced",
]);

const ALLOWED: Record<TxStatus, ReadonlySet<TxStatus>> = {
  idle: new Set(["simulating", "idle"]),
  simulating: new Set(["awaiting_signature", "failed", "idle"]),
  awaiting_signature: new Set(["broadcasting", "failed", "idle"]),
  broadcasting: new Set(["pending", "failed", "idle"]),
  pending: new Set(["confirmed", "failed", "replaced", "idle"]),
  confirmed: new Set(["idle", "simulating"]),
  failed: new Set(["idle", "simulating"]),
  replaced: new Set(["idle", "simulating"]),
};

export function canTransition(from: TxStatus, to: TxStatus): boolean {
  return ALLOWED[from].has(to);
}

export function transition(
  state: TxLifecycleState,
  next: TxStatus,
  patch: Partial<Omit<TxLifecycleState, "status">> = {},
): TxLifecycleState {
  if (!canTransition(state.status, next)) {
    throw new Error(`Invalid tx transition: ${state.status} → ${next}`);
  }
  return {
    ...state,
    ...patch,
    status: next,
    error: next === "failed" ? patch.error ?? state.error : undefined,
  };
}

export function isTerminal(status: TxStatus): boolean {
  return TERMINAL.has(status) && status !== "idle";
}

export function statusLabel(status: TxStatus): string {
  switch (status) {
    case "idle":
      return "Ready";
    case "simulating":
      return "Simulating";
    case "awaiting_signature":
      return "Awaiting signature";
    case "broadcasting":
      return "Broadcasting";
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "failed":
      return "Failed";
    case "replaced":
      return "Replaced";
  }
}
