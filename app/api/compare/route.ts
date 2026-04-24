import { NextResponse } from "next/server";
import { runScan, type ScanReport } from "@/lib/scanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TARGETS = 8;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const urls = (body as { urls?: unknown })?.urls;
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: "urls array required" }, { status: 400 });
  }
  const clean = urls
    .filter((u): u is string => typeof u === "string")
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, MAX_TARGETS);
  if (clean.length === 0) {
    return NextResponse.json({ error: "no valid urls" }, { status: 400 });
  }
  const settled = await Promise.allSettled(clean.map((u) => runScan(u)));
  const reports = settled.map(
    (s, i): { url: string; report: ScanReport | null; error: string | null } => ({
      url: clean[i],
      report: s.status === "fulfilled" ? s.value : null,
      error: s.status === "rejected" ? String(s.reason) : null,
    }),
  );
  return NextResponse.json({ reports });
}
