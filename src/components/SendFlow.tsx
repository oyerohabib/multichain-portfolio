"use client";

import { useEffect, useMemo, useState } from "react";
import { erc20Abi, isAddress, parseUnits, type Address, type Hex } from "viem";
import {
  useAccount,
  usePublicClient,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { getAppChainById } from "@/lib/chains";
import { formatTokenAmount } from "@/lib/format";
import type { PortfolioToken } from "@/lib/alchemy";
import { useTxStore } from "@/stores/tx-store";

type Props = {
  token: PortfolioToken | null;
  open: boolean;
  onClose: () => void;
};

export function SendFlow({ token, open, onClose }: Props) {
  if (!open || !token) return null;

  return (
    <SendFlowDialog
      key={`${token.network}-${token.contractAddress ?? "native"}`}
      token={token}
      onClose={onClose}
    />
  );
}

function SendFlowDialog({
  token,
  onClose,
}: {
  token: PortfolioToken;
  onClose: () => void;
}) {
  const { address, chainId: walletChainId } = useAccount();
  const publicClient = usePublicClient({ chainId: token.chainId });
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();

  const setStatus = useTxStore((s) => s.setStatus);
  const fail = useTxStore((s) => s.fail);
  const reset = useTxStore((s) => s.reset);
  const txStatus = useTxStore((s) => s.status);
  const txHash = useTxStore((s) => s.hash);

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const receipt = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: token.chainId,
    query: { enabled: Boolean(txHash) && txStatus === "pending" },
  });

  // Fresh form state comes from remount (key). Clear in-flight tx status only.
  useEffect(() => {
    const status = useTxStore.getState().status;
    if (
      status !== "confirmed" &&
      status !== "failed" &&
      status !== "replaced"
    ) {
      reset();
    }
  }, [reset]);

  useEffect(() => {
    if (txStatus !== "pending") return;
    if (receipt.isSuccess) {
      setStatus("confirmed");
    } else if (receipt.isError) {
      fail(receipt.error?.message ?? "Transaction failed on-chain");
    }
  }, [
    receipt.isSuccess,
    receipt.isError,
    receipt.error,
    setStatus,
    fail,
    txStatus,
  ]);

  const chain = useMemo(
    () => getAppChainById(token.chainId),
    [token.chainId],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (!address) {
      setLocalError("Connect a wallet to send");
      return;
    }
    if (!isAddress(to)) {
      setLocalError("Recipient must be a valid address");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setLocalError("Enter an amount greater than zero");
      return;
    }

    try {
      if (walletChainId !== token.chainId) {
        await switchChainAsync({ chainId: token.chainId });
      }

      const value = parseUnits(amount, token.decimals);
      const description = `Send ${amount} ${token.symbol} on ${chain?.shortName ?? token.network}`;

      setStatus("simulating", {
        chainId: token.chainId,
        description,
        hash: undefined,
        error: undefined,
      });

      if (!publicClient) {
        throw new Error("RPC client unavailable");
      }

      if (token.contractAddress) {
        await publicClient.simulateContract({
          account: address,
          address: token.contractAddress as Address,
          abi: erc20Abi,
          functionName: "transfer",
          args: [to as Address, value],
        });
      } else {
        await publicClient.call({
          account: address,
          to: to as Address,
          value,
        });
      }

      setStatus("awaiting_signature", { description });

      let hash: Hex;
      setStatus("broadcasting", { description });

      if (token.contractAddress) {
        hash = await writeContractAsync({
          address: token.contractAddress as Address,
          abi: erc20Abi,
          functionName: "transfer",
          args: [to as Address, value],
          chainId: token.chainId,
        });
      } else {
        hash = await sendTransactionAsync({
          to: to as Address,
          value,
          chainId: token.chainId,
        });
      }

      setStatus("pending", { hash, description, chainId: token.chainId });
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Transaction failed";
      const shortened =
        message.length > 180 ? `${message.slice(0, 180)}…` : message;
      fail(shortened, {
        chainId: token.chainId,
        description: `Send ${amount} ${token.symbol}`,
      });
      setLocalError(shortened);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="send-title" className="font-display text-xl text-[var(--ink)]">
              Send {token.symbol}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {chain?.shortName ?? token.network} · balance{" "}
              {formatTokenAmount(token.balance)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--muted)] underline underline-offset-2"
          >
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4" data-testid="send-form">
          <div>
            <label
              htmlFor="send-to"
              className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase"
            >
              To
            </label>
            <input
              id="send-to"
              data-testid="send-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0x…"
              className="mt-1 h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-mono text-sm outline-none focus:ring-2 focus:ring-teal-700/30"
            />
          </div>
          <div>
            <label
              htmlFor="send-amount"
              className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase"
            >
              Amount
            </label>
            <input
              id="send-amount"
              data-testid="send-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              inputMode="decimal"
              className="mt-1 h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-mono text-sm outline-none focus:ring-2 focus:ring-teal-700/30"
            />
          </div>

          {localError ? (
            <p className="text-sm text-red-600" role="alert">
              {localError}
            </p>
          ) : null}

          <button
            type="submit"
            data-testid="send-submit"
            className="h-11 w-full rounded-lg bg-teal-800 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-60"
            disabled={
              txStatus === "simulating" ||
              txStatus === "awaiting_signature" ||
              txStatus === "broadcasting"
            }
          >
            {txStatus === "simulating"
              ? "Simulating…"
              : txStatus === "awaiting_signature"
                ? "Confirm in wallet…"
                : txStatus === "broadcasting"
                  ? "Broadcasting…"
                  : "Simulate & send"}
          </button>
        </form>
      </div>
    </div>
  );
}
