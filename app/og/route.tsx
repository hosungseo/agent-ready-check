import { ImageResponse } from "next/og";
import { runScan } from "@/lib/scanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRADE_BG: Record<string, string> = {
  A: "#10b981",
  B: "#14b8a6",
  C: "#f59e0b",
  D: "#f97316",
  F: "#e11d48",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("url") ?? "https://example.com";
  let report;
  try {
    report = await runScan(target);
  } catch {
    report = null;
  }

  const width = 1200;
  const height = 630;

  if (!report) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fafaf7",
            color: "#0a0a0a",
            fontSize: 48,
          }}
        >
          agent-ready-check · 스캔 실패
        </div>
      ),
      { width, height },
    );
  }

  const pct = Math.round((report.totalScore / report.totalMax) * 100);
  const gradeColor = GRADE_BG[report.grade] ?? "#525252";
  const displayUrl = report.url.replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          background: "#fafaf7",
          color: "#0a0a0a",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            letterSpacing: 4,
            fontSize: 22,
            color: "#737373",
            textTransform: "uppercase",
          }}
        >
          agent-ready-check
        </div>
        <div style={{ display: "flex", marginTop: 32, alignItems: "flex-start", gap: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 200,
              height: 200,
              borderRadius: 28,
              background: gradeColor,
              color: "white",
              fontSize: 140,
              fontWeight: 800,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {report.grade}
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                fontSize: 36,
                fontWeight: 700,
                color: "#404040",
                marginBottom: 8,
              }}
            >
              {displayUrl}
            </div>
            <div style={{ display: "flex", fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>
              {report.totalScore}
              <span style={{ color: "#a3a3a3", fontWeight: 500 }}>
                {" / "}
                {report.totalMax}
              </span>
            </div>
            <div style={{ display: "flex", fontSize: 28, color: "#737373", marginTop: 8 }}>
              {pct}% ready
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginTop: 44,
          }}
        >
          {report.categories.map((c) => {
            const cPct = Math.round((c.score / c.max) * 100);
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    display: "flex",
                    width: 240,
                    fontSize: 20,
                    color: "#404040",
                  }}
                >
                  {c.title}
                </div>
                <div
                  style={{
                    display: "flex",
                    flex: 1,
                    height: 14,
                    background: "#e5e5e5",
                    borderRadius: 7,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: `${cPct}%`,
                      height: "100%",
                      background: "#0f766e",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    width: 90,
                    fontSize: 18,
                    color: "#525252",
                    justifyContent: "flex-end",
                  }}
                >
                  {c.score}/{c.max}
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "auto",
            fontSize: 18,
            color: "#a3a3a3",
          }}
        >
          19 checks · 143 pts max · scanned {new Date(report.scannedAt).toLocaleDateString("ko-KR")}
        </div>
      </div>
    ),
    { width, height },
  );
}
