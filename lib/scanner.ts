export type CheckStatus = "pass" | "warn" | "fail" | "info";

export type CheckResult = {
  id: string;
  title: string;
  status: CheckStatus;
  detail: string;
  evidence?: string;
  points: number;
  max: number;
};

export type CategoryResult = {
  id: string;
  title: string;
  summary: string;
  score: number;
  max: number;
  checks: CheckResult[];
};

export type ScanReport = {
  url: string;
  scannedAt: string;
  totalScore: number;
  totalMax: number;
  grade: string;
  categories: CategoryResult[];
};

const TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "AgentReadyCheck/0.2 (+https://github.com/seohoseong/agent-ready-check)",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function tryFetchText(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; text: string; contentType: string }> {
  try {
    const res = await fetchWithTimeout(url, init);
    const contentType = res.headers.get("content-type") ?? "";
    const text = res.ok ? await res.text() : "";
    return { ok: res.ok, status: res.status, text, contentType };
  } catch {
    return { ok: false, status: 0, text: "", contentType: "" };
  }
}

async function tryHead(
  url: string,
): Promise<{ ok: boolean; status: number; contentType: string }> {
  try {
    const res = await fetchWithTimeout(url, { method: "HEAD" });
    return {
      ok: res.ok,
      status: res.status,
      contentType: res.headers.get("content-type") ?? "",
    };
  } catch {
    return { ok: false, status: 0, contentType: "" };
  }
}

function normalizeOrigin(input: string): string {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  const parsed = new URL(u);
  return parsed.origin;
}

const AI_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "CCBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "Amazonbot",
  "Meta-ExternalAgent",
];

function parseRobots(text: string) {
  const lines = text.split(/\r?\n/);
  const blocks: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
  let current: (typeof blocks)[number] | null = null;
  const sitemaps: string[] = [];
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) {
      current = null;
      continue;
    }
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === "user-agent") {
      if (!current) {
        current = { agents: [], rules: [] };
        blocks.push(current);
      }
      current.agents.push(value);
    } else if (key === "allow" || key === "disallow") {
      if (current) current.rules.push({ allow: key === "allow", path: value });
    } else if (key === "sitemap") {
      sitemaps.push(value);
    }
  }
  return { blocks, sitemaps };
}

function botRulesMentioned(text: string) {
  const mentioned: string[] = [];
  const lower = text.toLowerCase();
  for (const bot of AI_BOTS) {
    if (lower.includes(bot.toLowerCase())) mentioned.push(bot);
  }
  return mentioned;
}

function extractJsonLd(html: string): string[] {
  const matches: string[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    matches.push(m[1].trim());
  }
  return matches;
}

function extractOgTags(html: string): string[] {
  const tags: string[] = [];
  const re = /<meta\b[^>]*property=["'](og:[^"']+)["'][^>]*content=["']([^"']*)["']/gi;
  const re2 = /<meta\b[^>]*content=["']([^"']*)["'][^>]*property=["'](og:[^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) tags.push(`${m[1]}=${m[2]}`);
  while ((m = re2.exec(html)) !== null) tags.push(`${m[2]}=${m[1]}`);
  return tags;
}

function extractFeeds(html: string): string[] {
  const feeds: string[] = [];
  const re = /<link\b[^>]*rel=["']alternate["'][^>]*>/gi;
  const matches = html.match(re) ?? [];
  for (const tag of matches) {
    if (/type=["']application\/(rss|atom)\+xml["']/i.test(tag)) {
      const href = tag.match(/href=["']([^"']+)["']/i);
      if (href) feeds.push(href[1]);
    }
  }
  return feeds;
}

function extractFaviconHints(html: string): boolean {
  return /<link\b[^>]*rel=["'](icon|shortcut icon|apple-touch-icon)["']/i.test(html);
}

function extractHreflangs(html: string): string[] {
  const found: string[] = [];
  const re = /<link\b[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) found.push(m[1]);
  return Array.from(new Set(found));
}

function extractManifestHref(html: string): string | null {
  const m = html.match(/<link\b[^>]*rel=["']manifest["'][^>]*href=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function detectApiHints(html: string): string[] {
  const hints: string[] = [];
  if (/\/graphql\b/i.test(html)) hints.push("graphql");
  if (/\bapi\.[\w.-]+\.[a-z]{2,}\b/i.test(html)) hints.push("api-subdomain");
  if (/\/api\/v\d/i.test(html)) hints.push("versioned-api");
  if (/swagger|openapi/i.test(html)) hints.push("swagger-mention");
  return hints;
}

function isValidJsonLd(block: string): boolean {
  try {
    const parsed = JSON.parse(block);
    if (Array.isArray(parsed)) return parsed.some((p) => p && typeof p === "object" && "@context" in p);
    return !!parsed && typeof parsed === "object" && "@context" in parsed;
  } catch {
    return false;
  }
}

export async function runScan(rawUrl: string): Promise<ScanReport> {
  const origin = normalizeOrigin(rawUrl);

  const [
    robots,
    sitemap,
    llms,
    llmsFull,
    aiTxt,
    mcp,
    aiPlugin,
    securityTxt,
    mdNegotiation,
    homeHtml,
    humansTxt,
    openapiJson,
    openapiYaml,
    openapiWellKnown,
    feedRoot,
    rssRoot,
    faviconIco,
    manifestJson,
    siteWebmanifest,
  ] = await Promise.all([
    tryFetchText(origin + "/robots.txt"),
    tryFetchText(origin + "/sitemap.xml"),
    tryFetchText(origin + "/llms.txt"),
    tryFetchText(origin + "/llms-full.txt"),
    tryFetchText(origin + "/ai.txt"),
    tryFetchText(origin + "/.well-known/mcp.json"),
    tryFetchText(origin + "/.well-known/ai-plugin.json"),
    tryFetchText(origin + "/.well-known/security.txt"),
    tryFetchText(origin + "/", { headers: { Accept: "text/markdown" } }),
    tryFetchText(origin + "/"),
    tryFetchText(origin + "/humans.txt"),
    tryHead(origin + "/openapi.json"),
    tryHead(origin + "/openapi.yaml"),
    tryHead(origin + "/.well-known/openapi.yaml"),
    tryHead(origin + "/feed"),
    tryHead(origin + "/rss"),
    tryHead(origin + "/favicon.ico"),
    tryHead(origin + "/manifest.json"),
    tryHead(origin + "/site.webmanifest"),
  ]);

  // --- Discoverability ---
  const discoverabilityChecks: CheckResult[] = [];

  if (robots.ok) {
    const parsed = parseRobots(robots.text);
    const hasSitemap = parsed.sitemaps.length > 0;
    discoverabilityChecks.push({
      id: "robots",
      title: "robots.txt",
      status: "pass",
      detail: `robots.txt 확인 (${robots.text.length} bytes, ${parsed.blocks.length} block, sitemap ${parsed.sitemaps.length}개)`,
      evidence: robots.text.slice(0, 600),
      points: 10,
      max: 10,
    });
    discoverabilityChecks.push({
      id: "robots-sitemap-ref",
      title: "robots.txt 안에 Sitemap 선언",
      status: hasSitemap ? "pass" : "warn",
      detail: hasSitemap
        ? `선언됨: ${parsed.sitemaps.slice(0, 2).join(", ")}`
        : "robots.txt에서 Sitemap: 줄을 찾을 수 없습니다.",
      points: hasSitemap ? 5 : 0,
      max: 5,
    });
  } else {
    discoverabilityChecks.push({
      id: "robots",
      title: "robots.txt",
      status: "fail",
      detail: `robots.txt를 가져오지 못했습니다 (status ${robots.status || "network"})`,
      points: 0,
      max: 10,
    });
    discoverabilityChecks.push({
      id: "robots-sitemap-ref",
      title: "robots.txt 안에 Sitemap 선언",
      status: "fail",
      detail: "robots.txt 자체가 없으므로 확인 불가.",
      points: 0,
      max: 5,
    });
  }

  discoverabilityChecks.push({
    id: "sitemap",
    title: "sitemap.xml",
    status: sitemap.ok ? "pass" : "fail",
    detail: sitemap.ok
      ? `sitemap.xml 응답 (${sitemap.text.length} bytes)`
      : `sitemap.xml이 없거나 접근 불가 (status ${sitemap.status || "network"})`,
    evidence: sitemap.ok ? sitemap.text.slice(0, 600) : undefined,
    points: sitemap.ok ? 10 : 0,
    max: 10,
  });

  // --- Content Accessibility ---
  const contentChecks: CheckResult[] = [];

  contentChecks.push({
    id: "llms-txt",
    title: "llms.txt",
    status: llms.ok ? "pass" : "fail",
    detail: llms.ok
      ? `llms.txt 제공됨 (${llms.text.length} bytes)`
      : "llms.txt 파일이 없습니다. AI 에이전트가 사이트 맥락을 읽을 진입점이 없습니다.",
    evidence: llms.ok ? llms.text.slice(0, 600) : undefined,
    points: llms.ok ? 15 : 0,
    max: 15,
  });

  contentChecks.push({
    id: "llms-full",
    title: "llms-full.txt",
    status: llmsFull.ok ? "pass" : "info",
    detail: llmsFull.ok
      ? "llms-full.txt 제공됨 — 전체 본문 번들 확인."
      : "llms-full.txt 부재 — 필수는 아니지만 있으면 에이전트 학습/요약 품질이 올라갑니다.",
    points: llmsFull.ok ? 5 : 0,
    max: 5,
  });

  const mdLooksMarkdown =
    mdNegotiation.ok &&
    (mdNegotiation.contentType.includes("markdown") ||
      /^#\s|\n#\s/.test(mdNegotiation.text.slice(0, 500)));
  contentChecks.push({
    id: "md-negotiation",
    title: "마크다운 콘텐츠 협상 (Accept: text/markdown)",
    status: mdLooksMarkdown ? "pass" : "warn",
    detail: mdLooksMarkdown
      ? `Accept: text/markdown 요청에 마크다운 응답 (content-type: ${mdNegotiation.contentType})`
      : `마크다운 협상 미지원 (content-type: ${mdNegotiation.contentType || "n/a"})`,
    points: mdLooksMarkdown ? 10 : 0,
    max: 10,
  });

  const jsonLdBlocks = homeHtml.ok ? extractJsonLd(homeHtml.text) : [];
  const validJsonLd = jsonLdBlocks.filter(isValidJsonLd);
  const jsonLdStatus: CheckStatus =
    validJsonLd.length > 0 ? "pass" : jsonLdBlocks.length > 0 ? "warn" : "warn";
  const jsonLdPoints =
    validJsonLd.length > 0 ? 7 : jsonLdBlocks.length > 0 ? 3 : 0;
  contentChecks.push({
    id: "json-ld",
    title: "JSON-LD 구조화 데이터 (schema.org)",
    status: jsonLdStatus,
    detail:
      validJsonLd.length > 0
        ? `유효 JSON-LD 블록 ${validJsonLd.length}개 탐지 (전체 ${jsonLdBlocks.length}개).`
        : jsonLdBlocks.length > 0
          ? `JSON-LD ${jsonLdBlocks.length}개 탐지되었으나 @context 파싱 실패 — 감점.`
          : "JSON-LD 블록이 없습니다. schema.org Organization/Article 등 마크업이 에이전트 이해도를 높입니다.",
    evidence: jsonLdBlocks[0]?.slice(0, 500),
    points: jsonLdPoints,
    max: 7,
  });

  const hreflangs = homeHtml.ok ? extractHreflangs(homeHtml.text) : [];
  contentChecks.push({
    id: "hreflang",
    title: "hreflang 대체 언어 링크",
    status: hreflangs.length >= 2 ? "pass" : hreflangs.length === 1 ? "warn" : "info",
    detail:
      hreflangs.length === 0
        ? "hreflang 대체 언어 링크 없음. 다국어 사이트라면 에이전트 언어 선택에 필수."
        : `탐지된 locale: ${hreflangs.join(", ")}`,
    points: hreflangs.length >= 2 ? 4 : hreflangs.length === 1 ? 2 : 0,
    max: 4,
  });

  const ogTags = homeHtml.ok ? extractOgTags(homeHtml.text) : [];
  const hasCoreOg = ["og:title", "og:description", "og:url"].every((k) =>
    ogTags.some((t) => t.startsWith(k + "=")),
  );
  contentChecks.push({
    id: "opengraph",
    title: "OpenGraph 메타 (og:title/description/url)",
    status: hasCoreOg ? "pass" : ogTags.length > 0 ? "warn" : "fail",
    detail:
      ogTags.length === 0
        ? "OpenGraph 태그를 찾지 못했습니다."
        : `탐지된 og 태그: ${ogTags.length}개 (핵심 3종 ${hasCoreOg ? "완비" : "부족"}).`,
    evidence: ogTags.slice(0, 8).join("\n"),
    points: hasCoreOg ? 5 : ogTags.length > 0 ? 2 : 0,
    max: 5,
  });

  const htmlFeeds = homeHtml.ok ? extractFeeds(homeHtml.text) : [];
  const hasFeed = htmlFeeds.length > 0 || feedRoot.ok || rssRoot.ok;
  contentChecks.push({
    id: "feed",
    title: "RSS/Atom 피드",
    status: hasFeed ? "pass" : "info",
    detail: hasFeed
      ? `피드 탐지: ${htmlFeeds[0] ?? (feedRoot.ok ? "/feed" : "/rss")}`
      : "RSS/Atom 피드를 찾지 못했습니다. 변경 추적 가능한 에이전트 수집원 권장.",
    points: hasFeed ? 5 : 0,
    max: 5,
  });

  // --- Bot Access Control ---
  const botChecks: CheckResult[] = [];

  if (robots.ok) {
    const mentioned = botRulesMentioned(robots.text);
    botChecks.push({
      id: "ai-bot-rules",
      title: "AI 봇 별도 규칙",
      status: mentioned.length >= 3 ? "pass" : mentioned.length >= 1 ? "warn" : "fail",
      detail:
        mentioned.length === 0
          ? "GPTBot, ClaudeBot, CCBot 등 AI 봇에 대한 명시적 규칙이 없습니다. 허용/차단 정책을 명시하세요."
          : `명시된 AI 봇: ${mentioned.join(", ")}`,
      points:
        mentioned.length >= 3 ? 10 : mentioned.length >= 1 ? 5 : 0,
      max: 10,
    });
  } else {
    botChecks.push({
      id: "ai-bot-rules",
      title: "AI 봇 별도 규칙",
      status: "fail",
      detail: "robots.txt가 없어 AI 봇 규칙도 없습니다.",
      points: 0,
      max: 10,
    });
  }

  botChecks.push({
    id: "ai-txt",
    title: "ai.txt (학습 정책 선언)",
    status: aiTxt.ok ? "pass" : "info",
    detail: aiTxt.ok
      ? "ai.txt 제공됨 — 학습/이용 정책 표명 확인."
      : "ai.txt 미제공. 학습 허용/차단 정책을 기계 판독 가능하게 선언하면 가점.",
    evidence: aiTxt.ok ? aiTxt.text.slice(0, 500) : undefined,
    points: aiTxt.ok ? 5 : 0,
    max: 5,
  });

  // --- Protocol Discovery ---
  const protocolChecks: CheckResult[] = [];

  protocolChecks.push({
    id: "mcp",
    title: ".well-known/mcp.json (Model Context Protocol)",
    status: mcp.ok ? "pass" : "fail",
    detail: mcp.ok
      ? "MCP 디스커버리 매니페스트 제공됨."
      : "MCP 매니페스트 없음. 에이전트가 툴/리소스 엔드포인트를 자동 발견할 수 없습니다.",
    evidence: mcp.ok ? mcp.text.slice(0, 500) : undefined,
    points: mcp.ok ? 15 : 0,
    max: 15,
  });

  protocolChecks.push({
    id: "ai-plugin",
    title: ".well-known/ai-plugin.json",
    status: aiPlugin.ok ? "pass" : "info",
    detail: aiPlugin.ok
      ? "ai-plugin.json 제공됨 (ChatGPT/OpenAI 호환 플러그인 매니페스트)."
      : "ai-plugin.json 미제공.",
    points: aiPlugin.ok ? 5 : 0,
    max: 5,
  });

  const openapiFound =
    openapiJson.ok || openapiYaml.ok || openapiWellKnown.ok;
  const openapiPath = openapiJson.ok
    ? "/openapi.json"
    : openapiYaml.ok
      ? "/openapi.yaml"
      : openapiWellKnown.ok
        ? "/.well-known/openapi.yaml"
        : null;
  protocolChecks.push({
    id: "openapi",
    title: "OpenAPI 스펙 (openapi.json/yaml)",
    status: openapiFound ? "pass" : "info",
    detail: openapiFound
      ? `OpenAPI 스펙 노출됨: ${openapiPath}`
      : "OpenAPI 스펙 미노출. API 제공 사이트라면 에이전트 도구 연결에 필수.",
    points: openapiFound ? 8 : 0,
    max: 8,
  });

  protocolChecks.push({
    id: "security-txt",
    title: ".well-known/security.txt",
    status: securityTxt.ok ? "pass" : "info",
    detail: securityTxt.ok
      ? "security.txt 제공됨 — 에이전트가 신뢰할 수 있는 연락 경로 확보."
      : "security.txt 미제공. 필수는 아니지만 신뢰 신호.",
    points: securityTxt.ok ? 5 : 0,
    max: 5,
  });

  const apiHints = homeHtml.ok ? detectApiHints(homeHtml.text) : [];
  protocolChecks.push({
    id: "api-hints",
    title: "API 엔드포인트 힌트",
    status: apiHints.length > 0 ? "pass" : "info",
    detail:
      apiHints.length > 0
        ? `홈 HTML에서 API 단서 탐지: ${apiHints.join(", ")}`
        : "API 엔드포인트 힌트(graphql, api 서브도메인, versioned-api 등) 미검출. API 제공 사이트라면 탐지 가능한 힌트 노출 권장.",
    points: apiHints.length > 0 ? 5 : 0,
    max: 5,
  });

  // --- Commerce / Misc ---
  const commerceChecks: CheckResult[] = [];

  const homeHasPaymentHints =
    homeHtml.ok &&
    /x402|payment-required|agent-payment|mpp|\bpaid-content\b/i.test(homeHtml.text);
  commerceChecks.push({
    id: "x402",
    title: "Agent 결제 프로토콜 힌트 (x402 / MPP)",
    status: homeHasPaymentHints ? "pass" : "info",
    detail: homeHasPaymentHints
      ? "홈 HTML에서 x402/MPP 관련 키워드 탐지 — 에이전트 결제 흐름 단서."
      : "x402/MPP 관련 힌트 미검출. 콘텐츠 유료화/에이전트 결제 도입 시 표준 권장.",
    points: homeHasPaymentHints ? 5 : 0,
    max: 5,
  });

  commerceChecks.push({
    id: "humans-txt",
    title: "humans.txt (사람용 메타)",
    status: humansTxt.ok ? "pass" : "info",
    detail: humansTxt.ok
      ? "humans.txt 제공됨 — 팀/스택 정보 노출."
      : "humans.txt 미제공. 필수는 아님.",
    points: humansTxt.ok ? 3 : 0,
    max: 3,
  });

  const faviconFromHtml = homeHtml.ok && extractFaviconHints(homeHtml.text);
  const hasFavicon = faviconIco.ok || faviconFromHtml;
  commerceChecks.push({
    id: "favicon",
    title: "Favicon / touch-icon",
    status: hasFavicon ? "pass" : "warn",
    detail: hasFavicon
      ? "favicon 또는 touch-icon 확인됨."
      : "favicon을 찾지 못했습니다. 브랜드/신뢰 신호 약화.",
    points: hasFavicon ? 2 : 0,
    max: 2,
  });

  const manifestRef = homeHtml.ok ? extractManifestHref(homeHtml.text) : null;
  const hasManifest = manifestJson.ok || siteWebmanifest.ok || !!manifestRef;
  commerceChecks.push({
    id: "manifest",
    title: "웹앱 매니페스트 (manifest.json / site.webmanifest)",
    status: hasManifest ? "pass" : "info",
    detail: hasManifest
      ? `manifest 확인됨 (${manifestJson.ok ? "/manifest.json" : siteWebmanifest.ok ? "/site.webmanifest" : manifestRef})`
      : "웹앱 매니페스트 미노출. PWA/설치형 에이전트 대응에 필요.",
    points: hasManifest ? 4 : 0,
    max: 4,
  });

  const categories: CategoryResult[] = [
    {
      id: "discoverability",
      title: "검색 가능성",
      summary: "크롤러와 에이전트가 사이트 구조를 발견할 수 있는가",
      score: sum(discoverabilityChecks, "points"),
      max: sum(discoverabilityChecks, "max"),
      checks: discoverabilityChecks,
    },
    {
      id: "content",
      title: "콘텐츠 접근성",
      summary: "AI 친화 포맷(마크다운·JSON-LD·OpenGraph·피드·hreflang)으로 본문을 제공하는가",
      score: sum(contentChecks, "points"),
      max: sum(contentChecks, "max"),
      checks: contentChecks,
    },
    {
      id: "bot-access",
      title: "봇 접근 제어",
      summary: "AI 봇에 대한 명시적 허용/차단 정책이 있는가",
      score: sum(botChecks, "points"),
      max: sum(botChecks, "max"),
      checks: botChecks,
    },
    {
      id: "protocols",
      title: "프로토콜 발견",
      summary: "MCP / ai-plugin / OpenAPI / security.txt / API 힌트 등 표준 엔드포인트",
      score: sum(protocolChecks, "points"),
      max: sum(protocolChecks, "max"),
      checks: protocolChecks,
    },
    {
      id: "commerce",
      title: "상거래·기타 표준",
      summary: "에이전트 결제(x402/MPP), PWA manifest, 신뢰 신호 부가 표준",
      score: sum(commerceChecks, "points"),
      max: sum(commerceChecks, "max"),
      checks: commerceChecks,
    },
  ];

  const totalScore = categories.reduce((a, c) => a + c.score, 0);
  const totalMax = categories.reduce((a, c) => a + c.max, 0);
  const pct = (totalScore / totalMax) * 100;
  const grade =
    pct >= 85 ? "A" : pct >= 70 ? "B" : pct >= 55 ? "C" : pct >= 40 ? "D" : "F";

  return {
    url: origin,
    scannedAt: new Date().toISOString(),
    totalScore,
    totalMax,
    grade,
    categories,
  };
}

function sum<T>(list: T[], key: keyof T): number {
  return list.reduce((a, c) => a + (c[key] as unknown as number), 0);
}
