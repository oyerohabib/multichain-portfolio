import { describe, expect, it } from "vitest";
import {
  INITIAL_TX_STATE,
  canTransition,
  statusLabel,
  transition,
} from "@/lib/tx/lifecycle";

describe("tx lifecycle", () => {
  it("allows the happy path", () => {
    let state = INITIAL_TX_STATE;
    state = transition(state, "simulating", { description: "Send 1 ETH" });
    state = transition(state, "awaiting_signature");
    state = transition(state, "broadcasting");
    state = transition(state, "pending", {
      hash: "0xabc",
      chainId: 1,
    });
    state = transition(state, "confirmed");

    expect(state.status).toBe("confirmed");
    expect(state.hash).toBe("0xabc");
    expect(statusLabel(state.status)).toBe("Confirmed");
  });

  it("supports failed and replaced terminals", () => {
    let state = transition(INITIAL_TX_STATE, "simulating");
    state = transition(state, "awaiting_signature");
    state = transition(state, "broadcasting");
    state = transition(state, "pending", { hash: "0x1" });
    state = transition(state, "replaced", { replacedBy: "0x2" });
    expect(state.status).toBe("replaced");
    expect(state.replacedBy).toBe("0x2");

    state = transition(INITIAL_TX_STATE, "simulating");
    state = transition(state, "failed", { error: "User rejected" });
    expect(state.status).toBe("failed");
    expect(state.error).toBe("User rejected");
  });

  it("rejects invalid transitions", () => {
    expect(canTransition("idle", "pending")).toBe(false);
    expect(() => transition(INITIAL_TX_STATE, "confirmed")).toThrow(
      /Invalid tx transition/,
    );
  });
});
