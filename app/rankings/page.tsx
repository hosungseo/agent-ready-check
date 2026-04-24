import Link from "next/link";
import path from "node:path";
import { readFile } from "node:fs/promises";
import type { RankingSnapshot } from "@/lib/ministries";

export const dynamic = "force-static";
export const revalidate = 3600;

async function loadSnapshot(): Promise<RankingSnapshot | null> {
  try {
    const file = path.resolve("public/data/rankings.json");
    const raw = await readFile(file, "utf-8");
    return JSON.parse(raw) as RankingSnapshot;
  } catch {
    return null;
  }
}

function gradeColor(grade: string) {
  return (
    {
      A: "bg-emerald-500",
      B: "bg-teal-500",
      C: "bg-amber-500",
      D: "bg-orange-500",
      F: "bg-rose-500",
    }[grade] ?? "bg-neutral-400"
  );
}

export default async function RankingsPage() {
  const snapshot = await loadSnapshot();

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">
          <Link href="/" className="underline hover:text-ink">
            ← 홈
          </Link>
          <span>rankings</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          정부 사이트 에이전트 준비도 랭킹
        </h1>
        <p className="text-neutral-600 max-w-2xl">
          중앙부처·공공포털·주요 광역자치단체·해외정부 사이트를 주 1회 스캔해
          공개합니다.{" "}
          {snapshot && (
            <span className="text-neutral-500">
              최근 갱신: {new Date(snapshot.generatedAt).toLocaleString("ko-KR")}
            </span>
          )}
        </p>
      </header>

      {!snapshot && (
        <div className="p-6 border border-amber-300 bg-amber-50 rounded-md">
          <div className="font-semibold mb-1">아직 스냅샷이 없습니다.</div>
          <div className="text-sm text-neutral-700 font-mono">pnpm rank</div>
          <div className="text-sm text-neutral-700 mt-1">
            로컬에서 위 명령을 실행하면{" "}
            <code className="font-mono">public/data/rankings.json</code>이 생성됩니다.
            GitHub Actions가 주 1회 자동 갱신합니다.
          </div>
        </div>
      )}

      {snapshot && <RankingTable snapshot={snapshot} />}
    </main>
  );
}

function RankingTable({ snapshot }: { snapshot: RankingSnapshot }) {
  const groups: Record<string, typeof snapshot.entries> = {};
  for (const e of snapshot.entries) {
    (groups[e.group] ??= []).push(e);
  }
  const order: (keyof typeof groups)[] = [
    "중앙부처",
    "공공포털",
    "광역자치단체",
    "해외정부",
  ];

  return (
    <div className="space-y-12">
      {order
        .filter((g) => groups[g]?.length)
        .map((g) => {
          const rows = groups[g];
          return (
            <section key={g}>
              <h2 className="text-lg font-semibold mb-3">{g}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left border-b-2 border-neutral-300">
                      <th className="py-3 pr-4 font-semibold w-12">#</th>
                      <th className="py-3 pr-4 font-semibold">사이트</th>
                      <th className="py-3 px-3 font-semibold">등급</th>
                      <th className="py-3 px-3 font-semibold">점수</th>
                      <th className="py-3 px-3 font-semibold">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const pct =
                        row.totalMax > 0
                          ? Math.round((row.totalScore / row.totalMax) * 100)
                          : 0;
                      return (
                        <tr
                          key={row.url}
                          className="border-b border-neutral-200 hover:bg-paper-warm"
                        >
                          <td className="py-3 pr-4 tabular-nums text-neutral-500">
                            {i + 1}
                          </td>
                          <td className="py-3 pr-4">
                            <Link
                              href={`/?url=${encodeURIComponent(row.url)}`}
                              className="font-medium underline decoration-neutral-300 hover:decoration-ink"
                            >
                              {row.name}
                            </Link>
                            <span className="text-neutral-400 text-xs ml-2">
                              {row.url.replace(/^https?:\/\//, "")}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded text-white font-bold ${gradeColor(row.grade)}`}
                            >
                              {row.grade}
                            </span>
                          </td>
                          <td className="py-3 px-3 tabular-nums">
                            {row.totalScore}/{row.totalMax}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-neutral-200 rounded overflow-hidden">
                                <div
                                  className="h-full bg-accent"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-neutral-600 tabular-nums">
                                {pct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
    </div>
  );
}
