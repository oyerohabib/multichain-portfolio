"use client";

import { getAppChainByNetwork } from "@/lib/chains";
import { formatRelativeTime, formatTokenAmount } from "@/lib/format";
import { shortenAddress } from "@/lib/address";
import type { ActivityItem } from "@/lib/alchemy";

type Props = {
  items: ActivityItem[];
  isLoading: boolean;
};

const directionLabel = {
  in: "Received",
  out: "Sent",
  self: "Self",
  unknown: "Transfer",
} as const;

export function ActivityFeed({ items, isLoading }: Props) {
  return (
    <section
      data-testid="activity-feed"
      className="flex h-[32rem] flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h2 className="font-display text-xl text-[var(--ink)]">Activity</h2>
        {!isLoading && items.length > 0 ? (
          <span className="text-sm text-[var(--muted)]">
            {items.length} transfers
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-[var(--wash)]"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted)]">
          No recent transfers across supported chains.
        </p>
      ) : (
        <ul className="mt-4 min-h-0 flex-1 divide-y divide-[var(--border)] overflow-y-auto">
          {items.map((item, index) => {
            const chain = getAppChainByNetwork(item.network);
            return (
              <li
                key={`${item.hash}-${item.network}-${item.category}-${item.direction}-${item.from}-${item.to}-${item.asset}-${item.value ?? "0"}-${index}`}
                className="flex items-start justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--ink)]">
                    {directionLabel[item.direction]} {item.asset}
                    {item.value != null
                      ? ` · ${formatTokenAmount(item.value, 4)}`
                      : ""}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {chain?.shortName ?? item.network} ·{" "}
                    {item.direction === "out"
                      ? `to ${shortenAddress(item.to || "0x")}`
                      : `from ${shortenAddress(item.from || "0x")}`}{" "}
                    · {formatRelativeTime(item.timestamp)}
                  </p>
                </div>
                <a
                  href={item.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 font-mono text-xs text-teal-800 underline-offset-2 hover:underline"
                >
                  {shortenAddress(item.hash, 3)}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
