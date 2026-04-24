export type FixHint = {
  summary: string;
  snippet?: string;
  language?: "txt" | "html" | "json" | "yaml" | "shell";
};

export const FIXES: Record<string, FixHint> = {
  robots: {
    summary: "사이트 루트에 /robots.txt 파일을 두고 최소 한 줄 이상의 정책을 선언하세요.",
    language: "txt",
    snippet: `User-agent: *
Allow: /
Sitemap: https://example.com/sitemap.xml`,
  },
  "robots-sitemap-ref": {
    summary: "robots.txt 본문에 Sitemap 절대 URL을 한 줄 추가하세요.",
    language: "txt",
    snippet: `Sitemap: https://example.com/sitemap.xml`,
  },
  sitemap: {
    summary: "/sitemap.xml에 최신 URL 목록을 노출하세요. Next.js라면 app/sitemap.ts로 생성 가능.",
    language: "html",
    snippet: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
</urlset>`,
  },
  "llms-txt": {
    summary: "사이트 루트에 /llms.txt를 두어 AI 에이전트에게 사이트 맥락을 요약 제공하세요.",
    language: "txt",
    snippet: `# 사이트명

> 한 줄 소개

## 주요 섹션
- [정책 자료](https://example.com/policy): 설명
- [데이터 개방](https://example.com/data): 설명

## 연락
- contact@example.com`,
  },
  "llms-full": {
    summary: "/llms-full.txt에 핵심 본문을 마크다운으로 평탄화하여 번들 노출.",
    language: "txt",
    snippet: `# 사이트명 — 전체 본문

## 페이지 1 제목
본문…

## 페이지 2 제목
본문…`,
  },
  "md-negotiation": {
    summary: "Accept: text/markdown 요청 시 마크다운으로 응답하도록 콘텐츠 협상 구현.",
    language: "txt",
    snippet: `# Next.js 예시 (route handler)
if (req.headers.get("accept")?.includes("text/markdown")) {
  return new Response(asMarkdown(post), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}`,
  },
  "json-ld": {
    summary: "<head>에 schema.org JSON-LD 블록을 넣어 Organization/Article 등 의미 정보를 노출.",
    language: "html",
    snippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "기관명",
  "url": "https://example.com"
}
</script>`,
  },
  hreflang: {
    summary: "다국어 페이지마다 <link rel=\"alternate\" hreflang=\"...\"> 태그를 노출.",
    language: "html",
    snippet: `<link rel="alternate" hreflang="ko" href="https://example.com/ko/" />
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
<link rel="alternate" hreflang="x-default" href="https://example.com/" />`,
  },
  opengraph: {
    summary: "최소 og:title, og:description, og:url, og:image 4종 메타를 노출.",
    language: "html",
    snippet: `<meta property="og:title" content="기관명" />
<meta property="og:description" content="한 줄 소개" />
<meta property="og:url" content="https://example.com" />
<meta property="og:image" content="https://example.com/og.png" />`,
  },
  feed: {
    summary: "RSS 또는 Atom 피드를 발행하고 <link rel=\"alternate\" type=\"application/rss+xml\">로 광고.",
    language: "html",
    snippet: `<link rel="alternate" type="application/rss+xml"
      title="기관 보도자료" href="/feed.xml" />`,
  },
  "ai-bot-rules": {
    summary: "robots.txt에 AI 봇별 명시적 정책을 추가. 차단·허용 모두 명시 권장.",
    language: "txt",
    snippet: `User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: CCBot
Disallow: /private/

User-agent: Google-Extended
Allow: /`,
  },
  "ai-txt": {
    summary: "/ai.txt에 학습·이용 정책을 기계 판독 가능한 형태로 선언.",
    language: "txt",
    snippet: `# https://spawning.ai/ai-txt
User-Agent: *
Disallow: /private/
Allow: /`,
  },
  mcp: {
    summary: ".well-known/mcp.json에 MCP 서버 디스커버리 매니페스트를 노출.",
    language: "json",
    snippet: `{
  "version": "0.1",
  "name": "example-mcp",
  "transports": [
    { "type": "http", "url": "https://example.com/mcp" }
  ]
}`,
  },
  "ai-plugin": {
    summary: ".well-known/ai-plugin.json (ChatGPT 호환 플러그인 매니페스트) 노출.",
    language: "json",
    snippet: `{
  "schema_version": "v1",
  "name_for_human": "기관명",
  "name_for_model": "agency",
  "description_for_human": "공공 데이터 접근",
  "description_for_model": "Search agency data",
  "api": { "type": "openapi", "url": "https://example.com/openapi.json" }
}`,
  },
  openapi: {
    summary: "API 제공 사이트라면 /openapi.json 또는 /.well-known/openapi.yaml에 스펙 노출.",
    language: "yaml",
    snippet: `openapi: 3.1.0
info:
  title: Example API
  version: "1.0"
paths:
  /v1/items:
    get:
      summary: List items`,
  },
  "security-txt": {
    summary: ".well-known/security.txt에 보안 연락 경로를 선언 (RFC 9116).",
    language: "txt",
    snippet: `Contact: mailto:security@example.com
Expires: 2027-01-01T00:00:00Z
Preferred-Languages: ko, en`,
  },
  "api-hints": {
    summary: "공개 API가 있다면 홈 HTML이나 헤더에 발견 가능한 단서를 노출 (Link 헤더, 푸터 링크).",
    language: "html",
    snippet: `<a href="/api/v1/docs">API 문서</a>
<!-- 또는 응답 헤더에 -->
Link: </openapi.json>; rel="service-desc"; type="application/openapi+json"`,
  },
  x402: {
    summary: "유료 콘텐츠가 있다면 x402 / MPP 헤더로 에이전트 결제 흐름을 표명.",
    language: "txt",
    snippet: `HTTP/1.1 402 Payment Required
X-PAYMENT: { "amount": "0.001", "currency": "USDC", "recipient": "0x..." }`,
  },
  "humans-txt": {
    summary: "/humans.txt에 팀·스택·연락처를 사람이 읽기 좋게 노출.",
    language: "txt",
    snippet: `/* TEAM */
Lead: 홍길동
Email: contact@example.com

/* SITE */
Last update: 2026-04-25
Standards: HTML5, CSS3
Components: Next.js`,
  },
  favicon: {
    summary: "/favicon.ico 또는 <link rel=\"icon\">로 favicon, apple-touch-icon 노출.",
    language: "html",
    snippet: `<link rel="icon" href="/favicon.ico" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`,
  },
  manifest: {
    summary: "/manifest.json 또는 /site.webmanifest로 웹앱 매니페스트 노출.",
    language: "json",
    snippet: `{
  "name": "기관명",
  "short_name": "기관",
  "start_url": "/",
  "display": "standalone",
  "icons": [{ "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" }]
}`,
  },
  "openid-config": {
    summary: "OAuth/OIDC를 지원한다면 .well-known/openid-configuration 노출 (에이전트 인증 흐름).",
    language: "json",
    snippet: `{
  "issuer": "https://example.com",
  "authorization_endpoint": "https://example.com/oauth/authorize",
  "token_endpoint": "https://example.com/oauth/token",
  "jwks_uri": "https://example.com/.well-known/jwks.json"
}`,
  },
  "agent-json": {
    summary: ".well-known/agent.json (신흥 에이전트 카드 컨벤션)에 에이전트가 알아야 할 사이트 메타 노출.",
    language: "json",
    snippet: `{
  "name": "기관명",
  "description": "에이전트가 사용할 사이트 한 줄 소개",
  "endpoints": {
    "search": "/api/search?q={query}",
    "docs":   "https://example.com/docs"
  },
  "contact": "agent@example.com"
}`,
  },
};
