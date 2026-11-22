import { getAddress, isAddress, type Address } from "viem";

/** Public Ethereum address with rich mainnet history — handy for watch-only demos. */
export const DEMO_WATCH_ADDRESS =
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address;

export function parseAddress(value: string): Address | null {
  const trimmed = value.trim();
  if (!isAddress(trimmed)) return null;
  return getAddress(trimmed);
}

export function shortenAddress(address: string, chars = 4): string {
  if (address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}
