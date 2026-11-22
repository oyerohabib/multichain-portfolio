"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getAppChainByNetwork, type NetworkMode } from "@/lib/chains";
import { formatUsd } from "@/lib/format";
import type { PortfolioToken } from "@/lib/alchemy";

type Props = {
  totalValueUsd: number;
  tokens: PortfolioToken[];
  source: "connected" | "watch" | null;
  mode: NetworkMode;
  isLoading: boolean;
};

export function NetWorth({
  totalValueUsd,
  tokens,
  source,
  mode,
  isLoading,
}: Props) {
  const byChain = Object.values(
    tokens.reduce<
      Record<string, { name: string; value: number; color: string }>
    >((acc, token) => {
      const appChain = getAppChainByNetwork(token.network);
      const key = token.network;
      if (!acc[key]) {
        acc[key] = {
          name: appChain?.shortName ?? token.network,
          value: 0,
          color: appChain?.accent ?? "#64748B",
        };
      }
      acc[key].value += token.valueUsd ?? 0;
      return acc;
    }, {}),
  ).filter((c) => c.value > 0);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium tracking-wide text-[var(--muted)] uppercase">
            Net worth
          </p>
          <p
            data-testid="net-worth"
            className="mt-2 font-display text-4xl tracking-tight text-[var(--ink)] sm:text-5xl"
          >
            {isLoading ? "…" : formatUsd(totalValueUsd)}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {source === "connected"
              ? mode === "testnet"
                ? "Connected wallet · Sepolia, Base Sepolia, OP Sepolia"
                : "Connected wallet · ETH, Base, Optimism"
              : source === "watch"
                ? mode === "testnet"
                  ? "Watch-only · Sepolia, Base Sepolia, OP Sepolia"
                  : "Watch-only · ETH, Base, Optimism"
                : "Connect a wallet or paste an address"}
          </p>
        </div>

        <div className="h-40 w-full max-w-xs">
          {byChain.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byChain}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {byChain.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    formatUsd(typeof value === "number" ? value : Number(value))
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
              {isLoading ? "Loading allocation…" : "No allocation yet"}
            </div>
          )}
        </div>
      </div>

      {byChain.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-3">
          {byChain.map((c) => (
            <li
              key={c.name}
              className="flex items-center gap-2 text-sm text-[var(--muted)]"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: c.color }}
              />
              {c.name} · {formatUsd(c.value)}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
