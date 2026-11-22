import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { fetchActivity } from "@/lib/alchemy";
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

    const activity = await fetchActivity(address, mode);
    return NextResponse.json(activity);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
