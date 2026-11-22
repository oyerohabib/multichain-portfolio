import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { fetchPortfolioCached } from "@/lib/alchemy";
import { isNetworkMode } from "@/lib/chains";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const address = body?.address;
    const mode = isNetworkMode(body?.mode) ? body.mode : "mainnet";

    if (typeof address !== "string" || !isAddress(address)) {
      return NextResponse.json(
        { error: "Invalid or missing address" },
        { status: 400 },
      );
    }

    if (!process.env.ALCHEMY_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Missing ALCHEMY_API_KEY. Copy .env.example to .env.local and add your Alchemy key.",
        },
        { status: 500 },
      );
    }

    const portfolio = await fetchPortfolioCached(address, mode);
    return NextResponse.json(portfolio, {
      headers: {
        // Hint browsers / intermediaries; primary speedup is the in-process TTL cache.
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
