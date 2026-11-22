"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { getAppChainById, type NetworkMode } from "@/lib/chains";
import { useNetworkModeStore } from "@/stores/network-mode-store";

const OPTIONS: { value: NetworkMode; label: string }[] = [
  { value: "mainnet", label: "Mainnet" },
  { value: "testnet", label: "Testnet" },
];

type Props = {
  /** Prevent thrashing while a mode switch fetch is in flight. */
  disabled?: boolean;
};

export function NetworkModeToggle({ disabled = false }: Props) {
  const mode = useNetworkModeStore((s) => s.mode);
  const setMode = useNetworkModeStore((s) => s.setMode);
  const { chainId, isConnected } = useAccount();
  const { switchChainAsync, isPending, error, reset } = useSwitchChain();

  const current = chainId ? getAppChainById(chainId) : undefined;
  const needsWalletSwitch =
    isConnected && mode === "testnet" && current?.mode === "mainnet";

  function onSelect(next: NetworkMode) {
    if (next === mode || disabled) return;
    // Only flip app data mode here — do not auto-call wallet_switchEthereumChain.
    // Auto-switching was crashing MetaMask UI (`reading 'origin'`).
    setMode(next);
    reset();
  }

  async function switchWalletToSepolia() {
    try {
      await switchChainAsync({ chainId: sepolia.id });
    } catch {
      // User rejection or wallet limitation; keep testnet read mode active.
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-2 sm:items-end">
      <div
        role="group"
        aria-label="Network mode"
        data-testid="network-mode-toggle"
        title={
          mode === "testnet"
            ? "Portfolio reads Sepolia, Base Sepolia, and OP Sepolia"
            : "Portfolio reads Ethereum, Base, and Optimism"
        }
        className={`inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5 ${
          disabled ? "opacity-60" : ""
        }`}
      >
        {OPTIONS.map((option) => {
          const active = mode === option.value;
          return (
            <button
              key={option.value}
              type="button"
              data-testid={`network-mode-${option.value}`}
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onSelect(option.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-wait ${
                active
                  ? "bg-teal-800 text-white"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {needsWalletSwitch ? (
        <button
          type="button"
          data-testid="switch-wallet-sepolia"
          onClick={() => void switchWalletToSepolia()}
          disabled={isPending}
          className="rounded-md border border-teal-800/40 bg-teal-800/10 px-2.5 py-1 text-xs font-medium text-teal-900 transition hover:bg-teal-800/15 disabled:opacity-60"
        >
          {isPending ? "Switching…" : "Switch wallet to Sepolia"}
        </button>
      ) : null}

      {error ? (
        <p className="max-w-[14rem] text-right text-xs text-red-600" role="alert">
          Couldn’t switch from the app. Open MetaMask → Sepolia.
        </p>
      ) : null}
    </div>
  );
}
