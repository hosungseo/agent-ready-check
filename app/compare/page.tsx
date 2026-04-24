"use client";

import { useState } from "react";
import Link from "next/link";
import type { ScanReport } from "@/lib/scanner";

type Row = {
  url: string;
  report: ScanReport | null;
  error: string | null;
};

const PRESETS: Record<string, string[]> = {
  "국내 중앙행정": [
    "https://www.korea.kr",
    "https://www.mois.go.kr",
    "https://www.moe.go.kr",
    "https://www.mohw.go.kr",
  ],
  "해외 정부·공공": [
    "https://www.gov.uk",
    "https://www.usa.gov",
    "https://www.singstat.gov.sg",
    "https://www.digital.gov",
  ],
  "AI·개발자 사이트": [
    "https://anthropic.com",
    "https://openai.com",
    "https://vercel.com",
    "https://github.com",
  ],
};

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

export default function ComparePage() {
  const [text, setText] = useState(PRESETS["국내 중앙행정"].join("\n"));
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const urls = text
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (urls.length === 0) return;
    setLoading(true);
    setError(null);
    setRows(null);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "compare failed");
      setRows(data.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  const categoryKeys = rows?.find((r) => r.report)?.report?.categories.map((c) => c.id) ?? [];
  const categoryTitles: Record<string, string> = Object.fromEntries(
    (rows?.find((r) => r.report)?.report?.categories ?? []).map((c) => [c.id, c.title]),
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">
          <Link href="/" className="underline hover:text-ink">
            ← 단일 스캔
          </Link>
          <span>compare board</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">다중 사이트 비교</h1>
        <p className="text-neutral-600 max-w-2xl">
          최대 8개 URL을 병렬 스캔해 에이전트 준비도를 한 화면에 펼칩니다. 쉼표 또는 줄바꿈으로 구분.
        </p>
      </header>

      <section className="mb-6">
        <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">프리셋</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([name, urls]) => (
            <button
              key={name}
              type="button"
              onClick={() => setText(urls.join("\n"))}
              className="px-3 py-1.5 text-sm border border-neutral-300 rounded-md bg-white hover:bg-paper-warm"
            >
              {name}
            </button>
          ))}
        </div>
      </section>

      <form onSubmit={onSubmit} className="mb-10 space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
          placeholder="https://example.com&#10;https://another.com"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-ink text-paper rounded-md font-medium hover:bg-ink-soft disabled:opacity-50 transition"
        >
          {loading ? "스캔 중…" : "일괄 스캔"}
        </button>
      </form>

      {error && (
        <div className="p-4 border border-rose-300 bg-rose-50 text-rose-900 rounded-md mb-8">
          에러: {error}
        </div>
      )}

      {loading && (
        <div className="text-neutral-500 animate-pulse">
          대상 사이트에 병렬 요청 중… 최대 약 10초 소요.
        </div>
      )}

      {rows && (
        <section className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b-2 border-neutral-300">
                <th className="py-3 pr-4 font-semibold">사이트</th>
                <th className="py-3 px-3 font-semibold">등급</th>
                <th className="py-3 px-3 font-semibold">총점</th>
                {categoryKeys.map((cid) => (
                  <th key={cid} className="py-3 px-3 font-semibold whitespace-nowrap">
                    {categoryTitles[cid]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows
                .slice()
                .sort((a, b) => (b.report?.totalScore ?? -1) - (a.report?.totalScore ?? -1))
                .map((row) => (
                  <tr key={row.url} className="border-b border-neutral-200 hover:bg-paper-warm">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/?url=${encodeURIComponent(row.url)}`}
                        className="font-medium underline decoration-neutral-300 hover:decoration-ink break-all"
                      >
                        {row.url.replace(/^https?:\/\//, "")}
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      {row.report ? (
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded text-white font-bold ${gradeColor(row.report.grade)}`}
                        >
                          {row.report.grade}
                        </span>
                      ) : (
                        <span className="text-rose-700 text-xs">실패</span>
                      )}
                    </td>
                    <td className="py-3 px-3 tabular-nums">
                      {row.report
                        ? `${row.report.totalScore}/${row.report.totalMax}`
                        : row.error?.slice(0, 40)}
                    </td>
                    {row.report
                      ? row.report.categories.map((c) => {
                          const pct = Math.round((c.score / c.max) * 100);
                          return (
                            <td key={c.id} className="py-3 px-3 tabular-nums">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-neutral-200 rounded overflow-hidden">
                                  <div
                                    className="h-full bg-accent"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs text-neutral-600">
                                  {c.score}/{c.max}
                                </span>
                              </div>
                            </td>
                          );
                        })
                      : categoryKeys.map((cid) => (
                          <td key={cid} className="py-3 px-3 text-neutral-400">
                            —
                          </td>
                        ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
