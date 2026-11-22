"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FormEvent, useState } from "react";
import {
  DEMO_WATCH_ADDRESS,
  parseAddress,
  shortenAddress,
} from "@/lib/address";
import { useAddressStore } from "@/stores/address-store";

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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full max-w-xl flex-1 flex-col gap-2">
        <form
          onSubmit={onSubmit}
          className="flex w-full flex-col gap-2 sm:flex-row sm:items-center"
        >
          <label className="sr-only" htmlFor="watch-address">
            Watch address
          </label>
          <input
            id="watch-address"
            data-testid="watch-address-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste 0x address to watch"
            className="h-11 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-mono text-sm outline-none ring-teal-700/30 placeholder:text-[var(--muted)] focus:ring-2"
          />
          <button
            type="submit"
            data-testid="watch-address-submit"
            className="h-11 rounded-lg bg-[var(--ink)] px-4 text-sm font-medium text-[var(--paper)] transition hover:opacity-90"
          >
            Watch
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
          <button
            type="button"
            data-testid="watch-demo-vitalik"
            onClick={watchDemo}
            disabled={watchingDemo}
            className="font-medium text-teal-800 underline-offset-2 transition hover:underline disabled:cursor-default disabled:no-underline disabled:opacity-70"
          >
            {watchingDemo ? "Watching Vitalik (demo)" : "Try Vitalik’s address"}
          </button>
          <span className="hidden sm:inline" aria-hidden>
            ·
          </span>
          <span>Best on Mainnet for a full portfolio view</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {watchAddress ? (
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <span
              data-testid="watching-address"
              className="rounded-md bg-teal-700/10 px-2 py-1 font-mono text-teal-800"
            >
              Watching {shortenAddress(watchAddress)}
            </span>
            <button
              type="button"
              data-testid="watch-address-clear"
              onClick={() => setWatchAddress(null)}
              className="text-xs underline underline-offset-2"
            >
              Clear
            </button>
          </div>
        ) : null}
        <ConnectButton chainStatus="icon" showBalance={false} />
      </div>
      {error ? (
        <p className="text-sm text-red-600 sm:basis-full" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
