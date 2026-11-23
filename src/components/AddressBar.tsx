"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FormEvent, useState } from "react";
import {
  DEMO_WATCH_ADDRESS,
  parseAddress,
  shortenAddress,
} from "@/lib/address";
import { useAddressStore } from "@/stores/address-store";

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AddressBar() {
  const watchAddress = useAddressStore((s) => s.watchAddress);
  const setWatchAddress = useAddressStore((s) => s.setWatchAddress);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = parseAddress(input);
    if (!parsed) {
      setError("Enter a valid 0x address");
      return;
    }
    setError(null);
    setWatchAddress(parsed);
    setInput("");
  }

  function watchDemo() {
    setError(null);
    setWatchAddress(DEMO_WATCH_ADDRESS);
    setInput("");
  }

  const watchingDemo = watchAddress === DEMO_WATCH_ADDRESS;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 w-full max-w-xl flex-1 flex-col gap-2">
        <form
          onSubmit={onSubmit}
          className="flex w-full min-w-0 items-center gap-2"
        >
          <label className="sr-only" htmlFor="watch-address">
            Watch address
          </label>
          <input
            id="watch-address"
            data-testid="watch-address-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste 0x address to watch"
            className="h-11 min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-mono text-sm outline-none ring-teal-700/30 placeholder:truncate placeholder:text-[var(--muted)] focus:ring-2"
            aria-invalid={Boolean(error)}
          />
          <button
            type="submit"
            data-testid="watch-address-submit"
            className="h-11 shrink-0 cursor-pointer rounded-lg bg-[var(--ink)] px-4 text-sm font-medium text-[var(--paper)] transition hover:opacity-90"
          >
            Watch
          </button>
        </form>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
          <button
            type="button"
            data-testid="watch-demo-vitalik"
            onClick={watchDemo}
            disabled={watchingDemo}
            className="cursor-pointer font-medium text-teal-800 underline-offset-2 transition hover:underline disabled:cursor-default disabled:no-underline disabled:opacity-70"
          >
            {watchingDemo ? "Watching Vitalik (demo)" : "Try Vitalik’s address"}
          </button>
          <span className="hidden sm:inline" aria-hidden>
            ·
          </span>
          <span className="hidden sm:inline">
            Best on Mainnet for a full portfolio view
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 self-start">
        {watchAddress ? (
          <div className="relative inline-flex">
            <span
              data-testid="watching-address"
              className="inline-flex h-10 items-center rounded-md bg-teal-700/10 px-2.5 pr-3.5 font-mono text-sm text-teal-800"
            >
              Watching {shortenAddress(watchAddress)}
            </span>
            <button
              type="button"
              data-testid="watch-address-clear"
              onClick={() => setWatchAddress(null)}
              aria-label="Clear watched address"
              title="Clear watched address"
              className="absolute -top-1.5 -right-1.5 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] shadow-sm transition hover:border-teal-800/40 hover:text-teal-900"
            >
              <ClearIcon className="h-2.5 w-2.5" />
            </button>
          </div>
        ) : null}
        <ConnectButton chainStatus="icon" showBalance={false} />
      </div>
    </div>
  );
}
