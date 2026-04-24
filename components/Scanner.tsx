"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ScanReport, CheckStatus } from "@/lib/scanner";

const STATUS_STYLES: Record<CheckStatus, string> = {
  pass: "bg-emerald-100 text-emerald-900 border-emerald-300",
  warn: "bg-amber-100 text-amber-900 border-amber-300",
  fail: "bg-rose-100 text-rose-900 border-rose-300",
  info: "bg-slate-100 text-slate-800 border-slate-300",
};

const STATUS_LABEL: Record<CheckStatus, string> = {
  pass: "PASS",
  warn: "WARN",
  fail: "FAIL",
  info: "INFO",
};

function Ring({ score, max, grade }: { score: number; max: number; grade: string }) {
  const pct = Math.round((score / max) * 100);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - pct / 100);
  return (
    <div className="relative w-40 h-40 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" stroke="#e5e7eb" strokeWidth="8" fill="none" />
        <circle
          cx="60"
          cy="60"
          r="54"
          stroke="#0f766e"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold tracking-tight">{grade}</div>
        <div className="text-xs text-neutral-500">
          {score} / {max} · {pct}%
        </div>
      </div>
    </div>
  );
}

export default function Scanner({ initialUrl }: { initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const didBootstrap = useRef(false);

  const runScan = useCallback(async (target: string) => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch(`/api/scan?url=${encodeURIComponent(target)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "scan failed");
      setReport(data);
      const params = new URLSearchParams(window.location.search);
      params.set("url", target);
      const next = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;
    if (initialUrl) {
      runScan(initialUrl);
    }
  }, [initialUrl, runScan]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const target = url.trim();
    if (!target) return;
    await runScan(target);
  }

  async function copyShareLink() {
    const link = `${window.location.origin}${window.location.pathname}?url=${encodeURIComponent(
      report?.url || url,
    )}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("링크를 복사하세요:", link);
    }
  }

  return (
    <>
      <header className="mb-12">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">
          <span>agent-ready-check · v0.4</span>
          <nav className="flex gap-4">
            <Link href="/rankings" className="underline hover:text-ink">
              랭킹
            </Link>
            <Link href="/compare" className="underline hover:text-ink">
              비교 보드 →
            </Link>
          </nav>
        </div>
        <h1 className="text-5xl font-bold tracking-tight leading-[1.05] mb-4">
          당신의 사이트는
          <br />
          <span className="text-accent">AI 에이전트</span>에 준비되어 있나요?
        </h1>
        <p className="text-neutral-600 max-w-2xl leading-relaxed">
          URL을 입력하면 robots · sitemap · llms.txt · MCP · OIDC · 마크다운 협상
          · JSON-LD · OpenGraph · OpenAPI 등 <b>23가지 에이전트 표준</b>을 한 번에
          점검하고, <b>실패 항목마다 고치는 법</b>까지 코드 스니펫으로 보여줍니다.
        </p>
      </header>

      <form onSubmit={onSubmit} className="mb-10">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.korea.kr"
            className="flex-1 px-4 py-3 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-accent text-base"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-ink text-paper rounded-md font-medium hover:bg-ink-soft disabled:opacity-50 transition"
          >
            {loading ? "스캔 중…" : "스캔"}
          </button>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-xs text-neutral-500">
          <span>예시:</span>
          {[
            "https://www.korea.kr",
            "https://anthropic.com",
            "https://vercel.com",
            "https://github.com",
          ].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setUrl(ex);
                runScan(ex);
              }}
              className="underline hover:text-ink"
            >
              {ex.replace("https://", "")}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="p-4 border border-rose-300 bg-rose-50 text-rose-900 rounded-md mb-8">
          에러: {error}
        </div>
      )}

      {loading && (
        <div className="text-neutral-500 animate-pulse">
          스캐너가 대상 사이트에 요청을 보내는 중입니다…
        </div>
      )}

      {report && (
        <section className="space-y-10">
          <div className="flex flex-col sm:flex-row gap-8 items-center p-6 bg-white border border-neutral-200 rounded-lg">
            <Ring score={report.totalScore} max={report.totalMax} grade={report.grade} />
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
                scanned target
              </div>
              <div className="text-xl font-semibold break-all mb-2">{report.url}</div>
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <span>{new Date(report.scannedAt).toLocaleString("ko-KR")}</span>
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="px-2 py-1 text-xs border border-neutral-300 rounded hover:bg-neutral-50"
                >
                  {copied ? "복사됨 ✓" : "링크 복사"}
                </button>
              </div>
            </div>
          </div>

          {report.categories.map((cat) => {
            const pct = Math.round((cat.score / cat.max) * 100);
            return (
              <div
                key={cat.id}
                className="border border-neutral-200 rounded-lg bg-white overflow-hidden"
              >
                <div className="flex items-start justify-between gap-4 p-5 border-b border-neutral-200 bg-paper-warm">
                  <div>
                    <h2 className="text-lg font-semibold">{cat.title}</h2>
                    <p className="text-sm text-neutral-600 mt-1">{cat.summary}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold tabular-nums">
                      {cat.score}
                      <span className="text-neutral-400 text-base">/{cat.max}</span>
                    </div>
                    <div className="text-xs text-neutral-500">{pct}%</div>
                  </div>
                </div>
                <ul className="divide-y divide-neutral-200">
                  {cat.checks.map((check) => {
                    const key = `${cat.id}:${check.id}`;
                    const isOpen = expanded[key];
                    const hasDetail = !!(check.evidence || check.fix);
                    return (
                      <li key={check.id} className="p-5">
                        <button
                          type="button"
                          onClick={() =>
                            hasDetail &&
                            setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
                          }
                          className={`w-full flex items-start gap-3 text-left ${
                            hasDetail ? "" : "cursor-default"
                          }`}
                        >
                          <span
                            className={`inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold rounded border ${STATUS_STYLES[check.status]}`}
                          >
                            {STATUS_LABEL[check.status]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium flex items-center gap-2">
                              {check.title}
                              {hasDetail && (
                                <span className="text-[10px] text-neutral-400">
                                  {isOpen ? "▼" : "▶"}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-neutral-600 mt-0.5">
                              {check.detail}
                            </div>
                          </div>
                          <div className="text-sm tabular-nums text-neutral-500 shrink-0">
                            {check.points}/{check.max}
                          </div>
                        </button>
                        {isOpen && check.fix && (
                          <div className="mt-3 p-4 border-l-4 border-accent bg-paper-warm rounded-r">
                            <div className="text-xs uppercase tracking-widest text-accent mb-1 font-semibold">
                              💡 고치는 법
                            </div>
                            <div className="text-sm text-neutral-800 mb-3">
                              {check.fix.summary}
                            </div>
                            {check.fix.snippet && (
                              <pre className="p-3 bg-neutral-900 text-neutral-100 text-xs rounded overflow-x-auto whitespace-pre">
                                {check.fix.snippet}
                              </pre>
                            )}
                          </div>
                        )}
                        {isOpen && check.evidence && (
                          <pre className="mt-3 p-3 bg-neutral-900 text-neutral-100 text-xs rounded overflow-x-auto whitespace-pre-wrap break-all max-h-64">
                            {check.evidence}
                          </pre>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </section>
      )}

      <footer className="mt-20 pt-8 border-t border-neutral-200 text-xs text-neutral-500">
        <p>
          영감: isitagentready.com · 구현: Next.js API Route로 서버사이드 스캔
          (CORS 무관). 코드:{" "}
          <a
            href="https://github.com/hosungseo/agent-ready-check"
            className="underline hover:text-ink"
          >
            github.com/hosungseo/agent-ready-check
          </a>
        </p>
        <p className="mt-1">
          체크 23종 (153점 만점): robots / sitemap / Sitemap 선언 / llms.txt /
          llms-full.txt / 마크다운 협상 / JSON-LD(유효성) / hreflang / OpenGraph /
          RSS·Atom / AI 봇 규칙 / ai.txt / mcp.json / ai-plugin.json / OpenAPI /
          openid-configuration / agent.json / security.txt / API 힌트 / x402 /
          humans.txt / favicon / manifest.
        </p>
      </footer>
    </>
  );
}
