"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import type { PortfolioToken } from "@/lib/alchemy";
import { DEMO_WATCH_ADDRESS } from "@/lib/address";
import { useActiveAddress } from "@/hooks/use-active-address";
import { useActivity } from "@/hooks/use-activity";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useNetworkModeStore } from "@/stores/network-mode-store";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AddressBar } from "@/components/AddressBar";
import { NetWorth } from "@/components/NetWorth";
import { NetworkModeToggle } from "@/components/NetworkModeToggle";
import { SendFlow } from "@/components/SendFlow";
import { TokenTable } from "@/components/TokenTable";
import { TxStatus } from "@/components/TxStatus";

export function PortfolioApp() {
  const { address, source } = useActiveAddress();
  const { isConnected } = useAccount();
  const mode = useNetworkModeStore((s) => s.mode);
  const portfolio = usePortfolio(address);
  const activity = useActivity(address);
  const [sendToken, setSendToken] = useState<PortfolioToken | null>(null);

  const tokens = portfolio.data?.tokens ?? [];
  const errorMessage =
    (portfolio.error instanceof Error ? portfolio.error.message : null) ||
    (activity.error instanceof Error ? activity.error.message : null);

  // Initial load only — mode switches keep previous data via keepPreviousData.
  const portfolioPending = portfolio.isPending && !portfolio.data;
  const activityPending = activity.isPending && !activity.data;
  const isRefreshing =
    (portfolio.isFetching || activity.isFetching) &&
    Boolean(portfolio.data || activity.data);
  const showingStale =
    portfolio.isPlaceholderData || activity.isPlaceholderData;

  const watchingDemo = address?.toLowerCase() === DEMO_WATCH_ADDRESS.toLowerCase();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium tracking-[0.18em] text-teal-800 uppercase">
              Multichain Portfolio
            </p>
            <h1 className="mt-1 font-display text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
              Balances, activity, and send — without the explorer tab.
            </h1>
          </div>
          <NetworkModeToggle disabled={isRefreshing} />
        </div>
        <AddressBar />
      </header>

      <TxStatus />

      {!address ? (
        <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <p className="font-display text-2xl text-[var(--ink)]">
            Start with a wallet or a watch address
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            Connect a wallet, paste any 0x address, or hit{" "}
            <strong>Try Vitalik’s address</strong> for a mainnet demo. Toggle{" "}
            <strong>Testnet</strong> for Sepolia with faucet ETH.
          </p>
        </section>
      ) : (
        <>
          {isRefreshing || showingStale ? (
            <div
              data-testid="portfolio-loading"
              className="rounded-xl border border-teal-800/20 bg-teal-800/5 px-4 py-2.5 text-sm text-teal-900"
              role="status"
              aria-live="polite"
            >
              Loading {mode === "testnet" ? "testnet" : "mainnet"} portfolio…
            </div>
          ) : null}

          {watchingDemo && mode === "testnet" && !isRefreshing ? (
            <div
              data-testid="demo-testnet-hint"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--muted)]"
            >
              Vitalik’s demo address is for <strong>Mainnet</strong>. Testnet
              may look empty or sparse — switch back, or connect your own
              Sepolia wallet.
            </div>
          ) : null}

          {errorMessage && !isRefreshing ? (
            <div
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {errorMessage}
            </div>
          ) : null}

          <div
            className={`flex flex-col gap-6 transition-opacity duration-200 ${
              isRefreshing || showingStale ? "opacity-55" : "opacity-100"
            }`}
          >
            <NetWorth
              totalValueUsd={portfolio.data?.totalValueUsd ?? 0}
              tokens={tokens}
              source={source}
              mode={mode}
              isLoading={portfolioPending}
            />

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <TokenTable
                tokens={tokens}
                truncated={Boolean(portfolio.data?.truncated)}
                isLoading={portfolioPending}
                canSend={isConnected && source === "connected"}
                onSend={setSendToken}
              />
              <ActivityFeed
                items={activity.data?.items ?? []}
                isLoading={activityPending}
              />
            </div>
          </div>

          {(portfolio.data?.partialErrors?.length ?? 0) > 0 ||
          (activity.data?.partialErrors?.length ?? 0) > 0 ? (
            <p className="text-xs text-[var(--muted)]">
              Some networks returned partial data. Shown balances may be
              incomplete.
            </p>
          ) : null}
        </>
      )}

      <SendFlow
        open={Boolean(sendToken)}
        token={sendToken}
        onClose={() => setSendToken(null)}
      />
    </div>
  );
}
