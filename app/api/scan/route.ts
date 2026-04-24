import { NextResponse } from "next/server";
import { runScan } from "@/lib/scanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("url");
  if (!target) {
    return NextResponse.json(
      { error: "url query parameter is required" },
      { status: 400 },
    );
  }
  try {
    const report = await runScan(target);
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
