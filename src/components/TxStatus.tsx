"use client";

import { explorerTxUrl } from "@/lib/chains";
import { statusLabel } from "@/lib/tx/lifecycle";
import { shortenAddress } from "@/lib/address";
import { useTxStore } from "@/stores/tx-store";

const STEPS = [
  "simulating",
  "awaiting_signature",
  "broadcasting",
  "pending",
  "confirmed",
] as const;

export function TxStatus() {
  const status = useTxStore((s) => s.status);
  const hash = useTxStore((s) => s.hash);
  const chainId = useTxStore((s) => s.chainId);
  const error = useTxStore((s) => s.error);
  const replacedBy = useTxStore((s) => s.replacedBy);
  const description = useTxStore((s) => s.description);
  const reset = useTxStore((s) => s.reset);

  if (status === "idle") return null;

  const activeIndex = STEPS.indexOf(
    status === "failed" || status === "replaced"
      ? "pending"
      : (status as (typeof STEPS)[number]),
  );

  return (
    <aside
      data-testid="tx-status"
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
            Transaction
          </p>
          <p className="mt-1 font-display text-lg text-[var(--ink)]">
            {statusLabel(status)}
          </p>
          {description ? (
            <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-xs text-[var(--muted)] underline underline-offset-2"
        >
          Dismiss
        </button>
      </div>

      <ol className="mt-4 flex flex-wrap gap-2">
        {STEPS.map((step, index) => {
          const done =
            status === "confirmed" ||
            (activeIndex >= 0 && index < activeIndex);
          const current =
            status === step ||
            (status === "failed" && step === "pending") ||
            (status === "replaced" && step === "pending");
          return (
            <li
              key={step}
              className={`rounded-full px-2.5 py-1 text-xs ${
                done
                  ? "bg-teal-700 text-white"
                  : current
                    ? "bg-teal-700/15 text-teal-900"
                    : "bg-[var(--wash)] text-[var(--muted)]"
              }`}
            >
              {statusLabel(step)}
            </li>
          );
        })}
      </ol>

      {hash && chainId ? (
        <p className="mt-3 font-mono text-xs text-[var(--muted)]">
          Hash{" "}
          <a
            href={explorerTxUrl(chainId, hash)}
            target="_blank"
            rel="noreferrer"
            className="text-teal-800 underline-offset-2 hover:underline"
          >
            {shortenAddress(hash, 6)}
          </a>
          <span className="ml-2 text-[var(--muted)]">
            (optional explorer link)
          </span>
        </p>
      ) : null}

      {status === "replaced" && replacedBy ? (
        <p className="mt-2 text-sm text-amber-700">
          Replaced by {shortenAddress(replacedBy, 6)}
        </p>
      ) : null}

      {status === "failed" && error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </aside>
  );
}
