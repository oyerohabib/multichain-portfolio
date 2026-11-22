"use client";

import { getAppChainByNetwork } from "@/lib/chains";
import { formatTokenAmount, formatUsd } from "@/lib/format";
import type { PortfolioToken } from "@/lib/alchemy";

type Props = {
  tokens: PortfolioToken[];
  truncated?: boolean;
  isLoading: boolean;
  onSend?: (token: PortfolioToken) => void;
  canSend: boolean;
};

export function TokenTable({
  tokens,
  truncated = false,
  isLoading,
  onSend,
  canSend,
}: Props) {
  return (
    <section
      data-testid="token-table"
      className="flex h-[32rem] flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h2 className="font-display text-xl text-[var(--ink)]">Tokens</h2>
        <span className="text-sm text-[var(--muted)]">
          {isLoading
            ? "…"
            : truncated
              ? `${tokens.length}+ assets`
              : `${tokens.length} assets`}
        </span>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-[var(--wash)]"
            />
          ))}
        </div>
      ) : tokens.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted)]">
          No fungible balances found on ETH, Base, or Optimism.
        </p>
      ) : (
        <div className="mt-4 min-h-0 flex-1 overflow-auto">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
              <tr>
                <th className="w-[36%] pb-3 font-medium">Asset</th>
                <th className="w-[14%] pb-3 font-medium">Chain</th>
                <th className="w-[18%] pb-3 font-medium">Balance</th>
                <th className="w-[12%] pb-3 font-medium">Price</th>
                <th className="w-[12%] pb-3 font-medium">Value</th>
                <th className="w-[8%] pb-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => {
                const chain = getAppChainByNetwork(token.network);
                const key = `${token.network}-${token.contractAddress ?? "native"}-${token.symbol}`;
                const balanceLabel = formatTokenAmount(token.balance);
                return (
                  <tr
                    key={key}
                    className="border-b border-[var(--border)]/70 last:border-0"
                  >
                    <td className="py-3 pr-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {token.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={token.logo}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-full bg-[var(--wash)]"
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--wash)] text-xs font-semibold">
                            {token.symbol.slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div
                            className="truncate font-medium text-[var(--ink)]"
                            title={token.symbol}
                          >
                            {token.symbol}
                          </div>
                          <div
                            className="truncate text-xs text-[var(--muted)]"
                            title={token.name}
                          >
                            {token.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="truncate py-3 pr-2 text-[var(--muted)]">
                      {chain?.shortName ?? token.network}
                    </td>
                    <td
                      className="truncate py-3 pr-2 font-mono tabular-nums"
                      title={String(token.balance)}
                    >
                      {balanceLabel}
                    </td>
                    <td className="truncate py-3 pr-2">
                      {formatUsd(token.priceUsd)}
                    </td>
                    <td className="truncate py-3 pr-2 font-medium">
                      {formatUsd(token.valueUsd)}
                    </td>
                    <td className="py-3 text-right">
                      {canSend && onSend ? (
                        <button
                          type="button"
                          onClick={() => onSend(token)}
                          className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition hover:border-teal-700 hover:text-teal-800"
                        >
                          Send
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
